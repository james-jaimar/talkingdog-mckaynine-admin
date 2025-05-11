
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
        
        if (error) throw error;
        
        // Get branding data (might not exist yet)
        const { data: brandingData, error: brandingError } = await supabase
          .from("branch_branding")
          .select("*")
          .eq("branch_id", currentTenant)
          .maybeSingle();
          
        if (brandingError && brandingError.code !== 'PGRST116') {
          throw brandingError;
        }
        
        // If branding data exists, return it
        if (brandingData) {
          return {
            id: brandingData.id,
            tenantId: brandingData.branch_id,
            appName: brandingData.app_name || "McKaynine Training", 
            logoUrl: brandingData.logo_url,
            primaryColor: brandingData.primary_color || "#9b87f5",
            secondaryColor: brandingData.secondary_color || "#7E69AB",
            accentColor: brandingData.accent_color || "#6E59A5",
            createdAt: brandingData.created_at,
            updatedAt: brandingData.updated_at
          } as TenantBranding;
        }
        
        // Return default branding if none exists
        return {
          tenantId: currentTenant,
          appName: "McKaynine Training",
          primaryColor: "#9b87f5",
          secondaryColor: "#7E69AB",
          accentColor: "#6E59A5"
        } as TenantBranding;
      } catch (error) {
        console.error("Error fetching tenant branding:", error);
        throw error;
      }
    },
    enabled: isPlatformAdmin,
  });
  
  // Update branding mutation
  const { mutateAsync: updateBranding, isPending: isUpdating } = useMutation({
    mutationFn: async (brandingUpdate: Partial<TenantBranding>) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const updateData = {
        branch_id: currentTenant,
        app_name: brandingUpdate.appName,
        primary_color: brandingUpdate.primaryColor,
        secondary_color: brandingUpdate.secondaryColor,
        accent_color: brandingUpdate.accentColor,
        updated_at: new Date().toISOString(),
      };
      
      if (branding?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from("branch_branding")
          .update(updateData)
          .eq("id", branding.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("branch_branding")
          .insert({
            branch_id: currentTenant,
            app_name: brandingUpdate.appName || "McKaynine Training",
            primary_color: brandingUpdate.primaryColor || "#9b87f5",
            secondary_color: brandingUpdate.secondaryColor || "#7E69AB",
            accent_color: brandingUpdate.accentColor || "#6E59A5",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", currentTenant] });
    },
  });
  
  // Update logo URL mutation
  const { mutateAsync: updateLogoUrlFn } = useMutation({
    mutationFn: async (logoUrl: string) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const updateData = {
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      };
      
      if (branding?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from("branch_branding")
          .update(updateData)
          .eq("id", branding.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // Create new record with defaults + logo
        const { data, error } = await supabase
          .from("branch_branding")
          .insert({
            branch_id: currentTenant,
            app_name: "McKaynine Training",
            primary_color: "#9b87f5",
            secondary_color: "#7E69AB",
            accent_color: "#6E59A5",
            logo_url: logoUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", currentTenant] });
    },
  });
  
  const updateLogoUrl = async (url: string) => {
    await updateLogoUrlFn(url);
  };
  
  // Reset to defaults mutation
  const { mutateAsync: resetToDefaults } = useMutation({
    mutationFn: async () => {
      if (!branding?.id) return null;
      
      const { data, error } = await supabase
        .from("branch_branding")
        .update({
          app_name: "McKaynine Training",
          primary_color: "#9b87f5",
          secondary_color: "#7E69AB",
          accent_color: "#6E59A5",
          updated_at: new Date().toISOString(),
        })
        .eq("id", branding.id)
        .select();
        
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
