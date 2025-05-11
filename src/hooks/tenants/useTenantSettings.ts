
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useState } from "react";

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
        const { data: firstTenant } = await supabase
          .from("tenants")
          .select("id")
          .limit(1)
          .single();
          
        if (firstTenant) {
          setCurrentTenant(firstTenant.id);
        }
      }
      
      if (!currentTenant) return null;
      
      const { data, error } = await supabase
        .from("tenants")
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
        domain: data.domain,
        contactEmail: data.contact_email,
        description: data.description,
        isActive: data.is_active,
        maxUsers: data.max_users,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as TenantSettings;
    },
    enabled: isPlatformAdmin,
  });
  
  // Update tenant settings
  const { mutateAsync: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedSettings: Partial<TenantSettings>) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const { data, error } = await supabase
        .from("tenants")
        .update({
          name: updatedSettings.name,
          domain: updatedSettings.domain,
          contact_email: updatedSettings.contactEmail,
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
