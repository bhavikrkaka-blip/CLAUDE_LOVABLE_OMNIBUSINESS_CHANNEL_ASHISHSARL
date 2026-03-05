import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Banner {
  id: string;
  placement: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });
};

export const useBannerByPlacement = (placement: string) => {
  return useQuery({
    queryKey: ["banner", placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("placement", placement)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as Banner | null;
    },
  });
};

export const useActiveBannersByType = (placementPrefix: string) => {
  return useQuery({
    queryKey: ["banners", "active", placementPrefix],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .like("placement", `${placementPrefix}%`)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: Omit<Banner, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(banner)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Banner>;
    }) => {
      const { data, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

// Upload banner image to storage
export const useUploadBannerImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileName = `banners/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
  });
};
