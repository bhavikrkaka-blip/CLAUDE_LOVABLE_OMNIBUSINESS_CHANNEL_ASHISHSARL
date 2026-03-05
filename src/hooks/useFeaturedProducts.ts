import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./useProducts";

export type FeaturedProduct = {
  id: string;
  product_id: string;
  placement: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
};

export const useFeaturedProducts = (placement: string = "promo_banner") => {
  return useQuery({
    queryKey: ["featured-products", placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_products")
        .select(`
          *,
          product:products(*)
        `)
        .eq("placement", placement)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as (FeaturedProduct & { product: Product })[];
    },
  });
};

export const useAllFeaturedProducts = (placement: string = "promo_banner") => {
  return useQuery({
    queryKey: ["all-featured-products", placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_products")
        .select(`
          *,
          product:products(*)
        `)
        .eq("placement", placement)
        .order("display_order");

      if (error) throw error;
      return data as (FeaturedProduct & { product: Product })[];
    },
  });
};

export const useAddFeaturedProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      product_id,
      placement = "promo_banner",
      display_order = 0,
    }: {
      product_id: string;
      placement?: string;
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("featured_products")
        .insert({ product_id, placement, display_order })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["all-featured-products"] });
    },
  });
};

export const useRemoveFeaturedProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("featured_products")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["all-featured-products"] });
    },
  });
};

export const useUpdateFeaturedProductOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("featured_products")
          .update({ display_order: update.display_order })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["all-featured-products"] });
    },
  });
};
