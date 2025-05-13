
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

// Define the branch branding type to match the database structure
interface BranchBranding {
  id: string;
  branch_id: string;
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  created_at: string;
  updated_at: string;
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
        const { data: branch, error: branchError } = await supabase
          .from("branches")
          .select("*")
          .eq("id", currentTenant)
          .single();
        
        if (branchError) throw branchError;
        
        // Check if branch_branding table exists
        try {
          // Try to get branding data
          const { data: brandingData, error: brandingError } = await supabase
            .from("branch_branding")
            .select("*")
            .eq("branch_id", currentTenant)
            .maybeSingle();
            
          if (brandingError && brandingError.code !== 'PGRST116') {
            console.error("Error fetching branch branding:", brandingError);
            // Return default values if there's an error but not "no results" error
            return {
              tenantId: currentTenant,
              appName: "McKaynine Training",
              primaryColor: "#9b87f5",
              secondaryColor: "#7E69AB",
              accentColor: "#6E59A5"
            } as TenantBranding;
          }
          
          // If branding data exists, return it
          if (brandingData) {
            const typedData = brandingData as unknown as BranchBranding;
            return {
              id: typedData.id,
              tenantId: typedData.branch_id,
              appName: typedData.app_name || "McKaynine Training", 
              logoUrl: typedData.logo_url,
              primaryColor: typedData.primary_color || "#9b87f5",
              secondaryColor: typedData.secondary_color || "#7E69AB",
              accentColor: typedData.accent_color || "#6E59A5",
              createdAt: typedData.created_at,
              updatedAt: typedData.updated_at
            } as TenantBranding;
          }
        } catch (error) {
          console.error("Error attempting to access branch_branding table:", error);
        }
        
        // Return default branding if none exists or table doesn't exist
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
      
      // Check if branch_branding table exists
      try {
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
            
          if (error) {
            if (error.code === "42P01") { // relation does not exist
              console.error("branch_branding table does not exist:", error);
              // Just return success as we can't update what doesn't exist
              return [];
            }
            throw error;
          }
          return data;
        } else {
          // Create new record
          try {
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
              
            if (error) {
              if (error.code === "42P01") { // relation does not exist
                console.error("branch_branding table does not exist:", error);
                // Just return success as we can't update what doesn't exist
                return [];
              }
              throw error;
            }
            return data;
          } catch (innerError) {
            console.error("Error inserting into branch_branding:", innerError);
            return [];
          }
        }
      } catch (error) {
        console.error("Error updating branding:", error);
        return [];
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
      
      try {
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
            
          if (error) {
            if (error.code === "42P01") { // relation does not exist
              console.error("branch_branding table does not exist:", error);
              // Just return success as we can't update what doesn't exist
              return [];
            }
            throw error;
          }
          return data;
        } else {
          // Create new record with defaults + logo
          try {
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
              
            if (error) {
              if (error.code === "42P01") { // relation does not exist
                console.error("branch_branding table does not exist:", error);
                // Just return success as we can't update what doesn't exist
                return [];
              }
              throw error;
            }
            return data;
          } catch (innerError) {
            console.error("Error inserting into branch_branding:", innerError);
            return [];
          }
        }
      } catch (error) {
        console.error("Error updating logo URL:", error);
        return [];
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
      
      try {
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
          
        if (error) {
          if (error.code === "42P01") { // relation does not exist
            console.error("branch_branding table does not exist:", error);
            // Just return success as we can't update what doesn't exist
            return [];
          }
          throw error;
        }
        return data;
      } catch (error) {
        console.error("Error resetting to defaults:", error);
        return [];
      }
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
