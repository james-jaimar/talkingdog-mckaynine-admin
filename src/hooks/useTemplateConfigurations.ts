import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { toast } from "sonner";
import { PREBUILT_TEMPLATES, getPrebuiltTemplate } from "@/lib/email/templates";

export interface TemplateConfiguration {
  id: string;
  branch_id: string;
  template_code: string;
  class_type: string | null;
  name: string;
  description: string | null;
  variables: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTemplateConfigurations() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const configurationsQuery = useQuery({
    queryKey: ["template-configurations", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data, error } = await supabase
        .from("template_configurations")
        .select("*")
        .eq("branch_id", currentBranch.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as TemplateConfiguration[];
    },
    enabled: !!currentBranch?.id,
  });

  // Get all templates (pre-built + configured status)
  const templatesWithStatus = PREBUILT_TEMPLATES.map(template => {
    const config = configurationsQuery.data?.find(c => c.template_code === template.code);
    return {
      ...template,
      isConfigured: !!config,
      configuration: config || null,
      isActive: config?.is_active ?? false,
    };
  });

  const saveConfiguration = useMutation({
    mutationFn: async ({ 
      templateCode, 
      variables,
      isActive = true 
    }: { 
      templateCode: string; 
      variables: Record<string, string>;
      isActive?: boolean;
    }) => {
      if (!currentBranch?.id) throw new Error("No branch selected");
      
      const template = getPrebuiltTemplate(templateCode);
      if (!template) throw new Error("Template not found");

      const { data, error } = await supabase
        .from("template_configurations")
        .upsert({
          branch_id: currentBranch.id,
          template_code: templateCode,
          class_type: template.classType,
          name: template.name,
          description: template.description,
          variables,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'branch_id,template_code'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-configurations"] });
      toast.success("Template saved successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("template_configurations")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-configurations"] });
      toast.success("Template status updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  return {
    configurations: configurationsQuery.data || [],
    templatesWithStatus,
    isLoading: configurationsQuery.isLoading,
    error: configurationsQuery.error,
    saveConfiguration,
    toggleActive,
    refetch: configurationsQuery.refetch,
  };
}

// Hook to get a specific configured template for sending
export function useConfiguredTemplate(templateCode: string) {
  const { configurations } = useTemplateConfigurations();
  const config = configurations.find(c => c.template_code === templateCode);
  const template = getPrebuiltTemplate(templateCode);
  
  return {
    template,
    configuration: config,
    isConfigured: !!config,
    variables: config?.variables || {},
  };
}
