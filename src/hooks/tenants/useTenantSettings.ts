
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useState } from "react";
import { safeSingleRowQuery } from "@/lib/supabaseUtils";

export interface TenantSettings {
  id?: string;
  tenantId: string;
  name: string;
  domain: string;
  contactEmail: string;
  description: string;
  isActive: boolean;
  maxUsers: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useTenantSettings() {
  const { isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);
  
  // Fetch settings for the current tenant
  const { data: settings, isLoading } = useQuery({
    queryKey: ["tenant-settings", currentTenant],
    queryFn: async () => {
      // If no tenant is selected yet, get the first one (for platform admins)
      if (!currentTenant && isPlatformAdmin) {
        try {
          const { data: firstTenant } = await supabase
            .from("branches")
            .select("id")
            .limit(1)
            .single();
            
          if (firstTenant) {
            setCurrentTenant(firstTenant.id);
          }
        } catch (error) {
          console.error("Error fetching first tenant:", error);
        }
      }
      
      if (!currentTenant) return null;
      
      try {
        const { data, error } = await supabase
          .from("branches")
          .select("*")
          .eq("id", currentTenant)
          .single();
          
        if (error) {
          console.error("Error fetching tenant settings:", error);
          throw error;
        }
        
        return {
          id: data.id,
          tenantId: data.id,
          name: data.name,
          domain: data.domain || '',
          contactEmail: data.email || '',
          description: data.description || '',
          isActive: data.is_active !== undefined ? data.is_active : true,
          maxUsers: data.max_users || 10,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        } as TenantSettings;
      } catch (error) {
        console.error("Error in useTenantSettings:", error);
        throw error;
      }
    },
    enabled: isPlatformAdmin,
  });
  
  // Update tenant settings
  const { mutateAsync: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedSettings: Partial<TenantSettings>) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const { data, error } = await supabase
        .from("branches")
        .update({
          name: updatedSettings.name,
          domain: updatedSettings.domain,
          email: updatedSettings.contactEmail,
          description: updatedSettings.description,
          is_active: updatedSettings.isActive,
          max_users: updatedSettings.maxUsers,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentTenant)
        .select();
          
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-settings", currentTenant] });
    }
  });
  
  return {
    settings,
    isLoading: isLoading || isUpdating,
    currentTenant,
    setCurrentTenant,
    updateSettings
  };
}
