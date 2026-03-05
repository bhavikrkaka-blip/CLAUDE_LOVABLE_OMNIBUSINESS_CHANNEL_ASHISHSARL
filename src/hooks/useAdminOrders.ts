import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  shipping_fee?: number;
  coupon_discount?: number;
  order_items?: OrderItem[];
  delivery_zones?: { name: string; estimated_days: string } | null;
  coupons?: { code: string } | null;
  customer_email?: string;
  customer_name?: string;
}

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*),
          delivery_zones (name, estimated_days),
          coupons (code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch customer profiles for each order
      const ordersWithCustomers = await Promise.all(
        (orders || []).map(async (order) => {
          if (order.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name, phone")
              .eq("user_id", order.user_id)
              .single();
            
            return {
              ...order,
              customer_email: profile?.email || null,
              customer_name: profile?.full_name || null,
              customer_phone: profile?.phone || order.shipping_phone,
            };
          }
          return order;
        })
      );

      return ordersWithCustomers as Order[];
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      sendEmail = false,
      customerEmail,
      customerName,
      orderTotal
    }: { 
      orderId: string; 
      status: string;
      sendEmail?: boolean;
      customerEmail?: string;
      customerName?: string;
      orderTotal?: number;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Send email notification if requested
      if (sendEmail && customerEmail) {
        await supabase.functions.invoke("send-order-notification", {
          body: {
            email: customerEmail,
            customerName: customerName || "Customer",
            orderId,
            status,
            orderTotal,
          },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
};

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      paymentStatus 
    }: { 
      orderId: string; 
      paymentStatus: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get orders stats
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, status, payment_status, total_amount, created_at");

      if (ordersError) throw ordersError;

      // Get products count
      const { count: productsCount, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (productsError) throw productsError;

      // Get product views
      const { count: viewsCount, error: viewsError } = await supabase
        .from("product_views")
        .select("*", { count: "exact", head: true });

      if (viewsError) throw viewsError;

      // Calculate stats
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
      const confirmedOrders = orders?.filter(o => o.status === "confirmed").length || 0;
      const processingOrders = orders?.filter(o => o.status === "processing").length || 0;
      const shippedOrders = orders?.filter(o => o.status === "shipped").length || 0;
      const deliveredOrders = orders?.filter(o => o.status === "delivered").length || 0;
      const cancelledOrders = orders?.filter(o => o.status === "cancelled").length || 0;
      
      const totalRevenue = orders
        ?.filter(o => o.payment_status === "paid")
        .reduce((sum, o) => sum + o.total_amount, 0) || 0;
      
      const pendingPayments = orders
        ?.filter(o => o.payment_status === "pending")
        .reduce((sum, o) => sum + o.total_amount, 0) || 0;

      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders?.filter(o => new Date(o.created_at) >= today).length || 0;

      return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        pendingPayments,
        todayOrders,
        totalProducts: productsCount || 0,
        totalViews: viewsCount || 0,
      };
    },
  });
};
