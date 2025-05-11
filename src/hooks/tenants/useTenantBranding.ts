
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";

export interface TenantBranding {
  id?: string;
  tenantId: string;
  appName: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useTenantBranding() {
  const { isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);
  
  // Fetch current tenant branding
  const { data: branding, isLoading } = useQuery({
    queryKey: ["tenant-branding", currentTenant],
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
        .from("tenant_branding")
        .select("*")
        .eq("tenant_id", currentTenant)
        .single();
        
      if (error && error.code !== 'PGRST116') { // Not found error code
        console.error("Error fetching tenant branding:", error);
        throw error;
      }
      
      return data as TenantBranding | null;
    },
    enabled: isPlatformAdmin,
  });
  
  // Update branding mutation
  const { mutateAsync: updateBranding, isPending: isUpdating } = useMutation({
    mutationFn: async (brandingUpdate: Partial<TenantBranding>) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const updateData = {
        tenant_id: currentTenant,
        ...brandingUpdate,
        updated_at: new Date().toISOString(),
      };
      
      if (branding?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from("tenant_branding")
          .update(updateData)
          .eq("id", branding.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("tenant_branding")
          .insert({
            tenant_id: currentTenant,
            app_name: brandingUpdate.appName || "McKaynine Training",
            primary_color: brandingUpdate.primaryColor || "#9b87f5",
            secondary_color: brandingUpdate.secondaryColor || "#7E69AB",
            accent_color: brandingUpdate.accentColor || "#6E59A5",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", currentTenant] });
    },
  });
  
  // Update logo URL mutation
  const { mutateAsync: updateLogoUrl } = useMutation({
    mutationFn: async (logoUrl: string) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const updateData = {
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      };
      
      if (branding?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from("tenant_branding")
          .update(updateData)
          .eq("id", branding.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Create new record with defaults + logo
        const { data, error } = await supabase
          .from("tenant_branding")
          .insert({
            tenant_id: currentTenant,
            app_name: "McKaynine Training",
            primary_color: "#9b87f5",
            secondary_color: "#7E69AB",
            accent_color: "#6E59A5",
            logo_url: logoUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", currentTenant] });
    },
  });
  
  // Reset to defaults mutation
  const { mutateAsync: resetToDefaults } = useMutation({
    mutationFn: async () => {
      if (!branding?.id) return null;
      
      const { data, error } = await supabase
        .from("tenant_branding")
        .update({
          app_name: "McKaynine Training",
          primary_color: "#9b87f5",
          secondary_color: "#7E69AB",
          accent_color: "#6E59A5",
          updated_at: new Date().toISOString(),
        })
        .eq("id", branding.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", currentTenant] });
    },
  });
  
  return {
    branding,
    isLoading: isLoading || isUpdating,
    currentTenant,
    setCurrentTenant,
    updateBranding, 
    updateLogoUrl,
    resetToDefaults
  };
}
