
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { PostgrestError } from "@supabase/supabase-js";
import { checkTableExists, safeTableQuery } from "@/lib/supabaseUtils";

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

  // Check if branch_branding table exists
  const { data: tableExists } = useQuery({
    queryKey: ["branch-branding-table-exists"],
    queryFn: async () => {
      return await checkTableExists(() => 
        supabase.from("branch_branding").select("id").limit(1)
      );
    },
    // Cache this check for a while since table structure doesn't change often
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch current tenant branding
  const { data: branding, isLoading } = useQuery({
    queryKey: ["tenant-branding", currentTenant, tableExists],
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
        
        // Default branding values
        const defaultBranding: TenantBranding = {
          tenantId: currentTenant,
          appName: "McKaynine Training",
          primaryColor: "#9b87f5",
          secondaryColor: "#7E69AB",
          accentColor: "#6E59A5"
        };
        
        // If table doesn't exist or we're not sure yet, return defaults
        if (tableExists === false) {
          return defaultBranding;
        }
        
        // Try to get branding data if the table exists
        const result = await safeTableQuery<BranchBranding | null>(
          () => supabase
            .from("branch_branding")
            .select("*")
            .eq("branch_id", currentTenant)
            .maybeSingle(),
          null
        );
        
        // If branding data exists, return it mapped to our interface
        if (result) {
          return {
            id: result.id,
            tenantId: result.branch_id,
            appName: result.app_name || "McKaynine Training", 
            logoUrl: result.logo_url,
            primaryColor: result.primary_color || "#9b87f5",
            secondaryColor: result.secondary_color || "#7E69AB",
            accentColor: result.accent_color || "#6E59A5",
            createdAt: result.created_at,
            updatedAt: result.updated_at
          } as TenantBranding;
        }
        
        // Return default branding if none exists
        return defaultBranding;
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
      
      // If the table doesn't exist, just return success (can't update what doesn't exist)
      if (tableExists === false) {
        console.log("branch_branding table doesn't exist yet, can't update branding");
        return null;
      }
      
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
      } catch (error) {
        if ((error as PostgrestError).code === "42P01") {
          console.log("branch_branding table doesn't exist yet");
          return null;
        }
        throw error;
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
      
      // If the table doesn't exist, just return success (can't update what doesn't exist)
      if (tableExists === false) {
        console.log("branch_branding table doesn't exist yet, can't update logo");
        return null;
      }
      
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
      } catch (error) {
        if ((error as PostgrestError).code === "42P01") {
          console.log("branch_branding table doesn't exist yet");
          return null;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", currentTenant] });
    },
  });
  
  // Reset to defaults mutation
  const { mutateAsync: resetToDefaults } = useMutation({
    mutationFn: async () => {
      if (!branding?.id || tableExists === false) return null;
      
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
          
        if (error) throw error;
        return data;
      } catch (error) {
        if ((error as PostgrestError).code === "42P01") {
          console.log("branch_branding table doesn't exist yet");
          return null;
        }
        throw error;
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
