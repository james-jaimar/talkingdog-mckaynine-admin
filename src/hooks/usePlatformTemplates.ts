
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface ConfigurableField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "time" | "number";
  placeholder?: string;
  defaultValue?: string;
}

export interface PlatformTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  class_type: string | null;
  subject: string;
  html_content: string;
  configurable_fields: ConfigurableField[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to safely parse configurable_fields from JSON
function parseConfigurableFields(json: Json | null): ConfigurableField[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as ConfigurableField[];
}

// Helper to convert ConfigurableField[] to Json
function toJsonFields(fields: ConfigurableField[]): Json {
  return fields as unknown as Json;
}

export function usePlatformTemplates() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["platform-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_email_templates")
        .select("*")
        .order("name");

      if (error) throw error;
      
      return (data || []).map(t => ({
        ...t,
        configurable_fields: parseConfigurableFields(t.configurable_fields)
      })) as PlatformTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<PlatformTemplate, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("platform_email_templates")
        .insert({
          code: template.code,
          name: template.name,
          description: template.description,
          class_type: template.class_type,
          subject: template.subject,
          html_content: template.html_content,
          configurable_fields: toJsonFields(template.configurable_fields),
          is_active: template.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
      toast.success("Template created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create template: " + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<PlatformTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("platform_email_templates")
        .update({
          name: template.name,
          description: template.description,
          class_type: template.class_type,
          subject: template.subject,
          html_content: template.html_content,
          configurable_fields: template.configurable_fields ? toJsonFields(template.configurable_fields) : undefined,
          is_active: template.is_active,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
      toast.success("Template updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update template: " + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("platform_email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete template: " + error.message);
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates?.find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");

      const { data, error } = await supabase
        .from("platform_email_templates")
        .insert({
          code: `${template.code}_copy_${Date.now()}`,
          name: `${template.name} (Copy)`,
          description: template.description,
          class_type: template.class_type,
          subject: template.subject,
          html_content: template.html_content,
          configurable_fields: toJsonFields(template.configurable_fields),
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-templates"] });
      toast.success("Template duplicated");
    },
    onError: (error) => {
      toast.error("Failed to duplicate template: " + error.message);
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}

export function usePlatformTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["platform-template", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("platform_email_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        configurable_fields: parseConfigurableFields(data.configurable_fields)
      } as PlatformTemplate;
    },
    enabled: !!id,
  });
}
