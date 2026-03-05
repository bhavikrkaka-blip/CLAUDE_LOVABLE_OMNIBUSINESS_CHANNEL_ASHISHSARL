import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  payment_method: string | null;
  payment_status: string;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export const useOrders = () => {
  const { user } = useCustomerAuth();

  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useCustomerAuth();

  return useMutation({
    mutationFn: async ({
      items,
      shippingAddress,
      shippingCity,
      shippingPhone,
      paymentMethod,
      notes,
      shippingFee = 0,
      deliveryZoneId,
      couponId,
      couponDiscount = 0,
      guestName,
      guestEmail,
    }: {
      items: { productId: string; productName: string; productPrice: number; quantity: number }[];
      shippingAddress: string;
      shippingCity: string;
      shippingPhone: string;
      paymentMethod: string;
      notes?: string;
      shippingFee?: number;
      deliveryZoneId?: string;
      couponId?: string;
      couponDiscount?: number;
      guestName?: string;
      guestEmail?: string;
    }) => {
      const subtotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
      const totalAmount = subtotal + shippingFee - couponDiscount;

      // Create order — user_id can be null for guest checkout
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          total_amount: Math.max(0, totalAmount),
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_phone: shippingPhone,
          notes: notes || null,
          ...(deliveryZoneId ? { delivery_zone_id: deliveryZoneId } : {}),
          shipping_fee: shippingFee,
          ...(couponId ? { coupon_id: couponId, coupon_discount: couponDiscount } : {}),
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Increment coupon uses if applied
      if (couponId) {
        await supabase.rpc("increment_coupon_uses" as any, { p_coupon_id: couponId }).throwOnError();
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_price: item.productPrice,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });
};
