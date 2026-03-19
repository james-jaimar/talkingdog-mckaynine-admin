
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  branch_id: string;
  name: string | null;
  type: string;
  subject: string;
  content: string;
  class_type: string | null;
  variables: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  type: string;
  subject: string;
  content: string;
  class_type?: string;
  variables?: string[];
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  is_active?: boolean;
}

export function useEmailTemplates() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["email-templates", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data, error } = await supabase
        .from("branch_email_templates")
        .select("*")
        .eq("branch_id", currentBranch.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Map the data to our interface with proper defaults
      return (data || []).map(template => ({
        ...template,
        name: template.name || template.type,
        variables: Array.isArray(template.variables) ? template.variables : [],
        is_active: template.is_active ?? true,
      })) as EmailTemplate[];
    },
    enabled: !!currentBranch?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!currentBranch?.id) throw new Error("No branch selected");
      
      // Generate a unique type by combining the base type with a timestamp
      // This avoids the unique constraint on branch_id + type
      const uniqueType = `${input.type}_${Date.now()}`;
      
      const { data, error } = await supabase
        .from("branch_email_templates")
        .insert({
          branch_id: currentBranch.id,
          name: input.name,
          type: uniqueType,
          subject: input.subject,
          content: input.content,
          class_type: input.class_type,
          variables: input.variables || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: UpdateTemplateInput & { id: string }) => {
      const { data, error } = await supabase
        .from("branch_email_templates")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      // First, clear any references in email_queue to avoid foreign key constraint
      const { error: queueError } = await supabase
        .from("email_queue")
        .update({ template_id: null })
        .eq("template_id", id);
      
      if (queueError) {
        console.warn("Could not clear email_queue references:", queueError);
        // Continue anyway - the queue might not have any references
      }

      // Also clear references in email_log
      const { error: logError } = await supabase
        .from("email_log")
        .update({ template_id: null })
        .eq("template_id", id);
      
      if (logError) {
        console.warn("Could not clear email_log references:", logError);
      }

      // Now delete the template
      const { error } = await supabase
        .from("branch_email_templates")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const copyToBranch = useMutation({
    mutationFn: async ({ templateId, targetBranchId }: { templateId: string; targetBranchId: string }) => {
      const { data: source, error: fetchError } = await supabase
        .from("branch_email_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (fetchError || !source) throw fetchError || new Error("Template not found");

      const uniqueType = `${source.type}_copy_${Date.now()}`;

      const { data, error } = await supabase
        .from("branch_email_templates")
        .insert({
          branch_id: targetBranchId,
          name: source.name,
          type: uniqueType,
          subject: source.subject,
          content: source.content,
          class_type: source.class_type,
          variables: source.variables || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to copy template: ${error.message}`);
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyToBranch,
    refetch: templatesQuery.refetch,
  };
}

// Get templates filtered by class type
export function useTemplatesForClassType(classType: string | null) {
  const { templates, isLoading } = useEmailTemplates();
  
  const filteredTemplates = classType
    ? templates.filter(t => t.is_active && (!t.class_type || t.class_type === classType))
    : templates.filter(t => t.is_active);
  
  return { templates: filteredTemplates, isLoading };
}
