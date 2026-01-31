import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemSetting {
  id: string;
  key: string;
  value: boolean | string | number | object;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a specific system setting by key
 */
export async function getSystemSetting(key: string): Promise<boolean | string | number | object | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return null;
  }
  
  return data?.value ?? null;
}

/**
 * Get IO offline mode setting - used by invoice sync
 */
export async function getIOOfflineMode(): Promise<boolean> {
  const value = await getSystemSetting('io_offline_mode');
  return value === true;
}

/**
 * Hook to fetch and manage system settings
 */
export function useSystemSettings() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
  
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean | string | number | object }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: value as any })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (error) => {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    },
  });
  
  // Helper to get a specific setting value
  const getSetting = (key: string): boolean | string | number | object | null => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value ?? null;
  };
  
  return {
    settings,
    isLoading,
    error,
    getSetting,
    updateSetting: updateSetting.mutate,
    isUpdating: updateSetting.isPending,
  };
}
