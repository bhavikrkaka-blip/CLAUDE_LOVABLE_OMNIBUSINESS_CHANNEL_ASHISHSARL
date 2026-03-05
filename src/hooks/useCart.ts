import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    name_fr: string | null;
    price: number;
    original_price: number | null;
    images: string[] | null;
    brand: string;
    in_stock: boolean | null;
  };
}

// Helper to find product UUID by name or get existing product
const findProductInDatabase = async (productIdOrName: string) => {
  // First try to find by exact UUID (if it's a valid UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(productIdOrName)) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("id", productIdOrName)
      .maybeSingle();
    return data?.id || null;
  }
  
  // Otherwise search by name (for static products)
  // Try to match by partial name derived from the slug
  const searchName = productIdOrName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  const { data } = await supabase
    .from("products")
    .select("id, name")
    .ilike("name", `%${searchName.split(' ').slice(-1)[0]}%`)
    .limit(1)
    .maybeSingle();
  
  return data?.id || null;
};

export const useCart = () => {
  const { user } = useCustomerAuth();

  return useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products (
            id, name, name_fr, price, original_price, images, brand, in_stock
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CartItem[];
    },
    enabled: !!user,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { user } = useCustomerAuth();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!user) throw new Error("Must be logged in");

      // Find the actual product UUID in the database
      const dbProductId = await findProductInDatabase(productId);
      
      if (!dbProductId) {
        throw new Error("Product not found in database. Please migrate products first.");
      }

      // Check if item already exists in cart
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", dbProductId)
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: dbProductId, quantity })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });
};

export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();
  const { user } = useCustomerAuth();

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity < 1) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId);
        
        if (error) throw error;
        return null;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const { user } = useCustomerAuth();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { user } = useCustomerAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });
};

export const useCartTotal = () => {
  const { data: cartItems } = useCart();
  
  if (!cartItems || cartItems.length === 0) {
    return { itemCount: 0, total: 0 };
  }

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return { itemCount, total };
};
