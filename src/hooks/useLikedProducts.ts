import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

interface LikedProduct {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    name_fr: string | null;
    price: number;
    original_price: number | null;
    images: string[] | null;
    brand: string;
    category: string;
    in_stock: boolean | null;
  };
}

export const useLikedProducts = () => {
  const { user } = useCustomerAuth();

  return useQuery({
    queryKey: ["liked-products", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("liked_products")
        .select(`
          *,
          product:products (
            id, name, name_fr, price, original_price, images, brand, category, in_stock
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LikedProduct[];
    },
    enabled: !!user,
  });
};

export const useIsProductLiked = (productId: string) => {
  const { data: likedProducts } = useLikedProducts();
  return likedProducts?.some(lp => lp.product_id === productId) ?? false;
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { user } = useCustomerAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Check if already liked
      const { data: existing } = await supabase
        .from("liked_products")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single();

      if (existing) {
        // Unlike
        const { error } = await supabase
          .from("liked_products")
          .delete()
          .eq("id", existing.id);
        
        if (error) throw error;
        return { liked: false };
      } else {
        // Like
        const { error } = await supabase
          .from("liked_products")
          .insert({ user_id: user.id, product_id: productId });
        
        if (error) throw error;
        return { liked: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liked-products", user?.id] });
    },
  });
};
