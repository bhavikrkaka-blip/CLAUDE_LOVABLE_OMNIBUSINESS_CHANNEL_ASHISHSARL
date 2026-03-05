import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemSettings {
  id: string;
  allow_negative_stock: boolean;
  fb_pixel_id: string | null;
  fb_pixel_enabled: boolean;
  ga4_measurement_id: string | null;
  created_at: string;
}

export function useSystemSettings() {
  return useQuery<SystemSettings>({
    queryKey: ["system_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .single();
      if (error) throw error;
      return data as SystemSettings;
    },
    staleTime: 60_000, // cache 1 min — settings rarely change
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Omit<SystemSettings, "id" | "created_at">>) => {
      const { data, error } = await supabase
        .from("system_settings")
        .update(updates)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_settings"] });
      toast.success("Settings saved");
    },
    onError: (err: Error) => {
      toast.error(`Failed to save settings: ${err.message}`);
    },
  });
}
