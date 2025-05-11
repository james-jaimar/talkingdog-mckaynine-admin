
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useState } from "react";

interface EmailTemplate {
  id?: string;
  tenantId: string;
  type: string;
  subject: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantNotificationSettings {
  id?: string;
  tenantId: string;
  fromEmail: string;
  replyToEmail: string;
  emailFooter: string;
  sendWelcomeEmail: boolean;
  sendInvoiceEmail: boolean;
  sendClassReminders: boolean;
  sendPaymentReminders: boolean;
  emailTemplates?: EmailTemplate[];
  createdAt?: string;
  updatedAt?: string;
}

export function useTenantNotifications() {
  const { isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);
  
  // Fetch notification settings for the current tenant
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["tenant-notifications", currentTenant],
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
        // Get notification settings
        const { data: settings, error } = await supabase
          .from("branch_notifications")
          .select("*")
          .eq("branch_id", currentTenant)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching tenant notification settings:", error);
          throw error;
        }
        
        // Get email templates
        const { data: templates, error: templatesError } = await supabase
          .from("branch_email_templates")
          .select("*")
          .eq("branch_id", currentTenant);
          
        if (templatesError) {
          console.error("Error fetching tenant email templates:", templatesError);
          throw templatesError;
        }
        
        const emailTemplates = templates?.map(template => ({
          id: template.id,
          tenantId: template.branch_id,
          type: template.type,
          subject: template.subject,
          content: template.content,
          createdAt: template.created_at,
          updatedAt: template.updated_at
        })) || [];
        
        if (!settings) {
          // Return default settings if none exist
          return {
            tenantId: currentTenant,
            fromEmail: "",
            replyToEmail: "",
            emailFooter: "",
            sendWelcomeEmail: true,
            sendInvoiceEmail: true,
            sendClassReminders: true,
            sendPaymentReminders: true,
            emailTemplates
          } as TenantNotificationSettings;
        }
        
        return {
          id: settings.id,
          tenantId: settings.branch_id,
          fromEmail: settings.from_email,
          replyToEmail: settings.reply_to_email,
          emailFooter: settings.email_footer,
          sendWelcomeEmail: settings.send_welcome_email,
          sendInvoiceEmail: settings.send_invoice_email,
          sendClassReminders: settings.send_class_reminders,
          sendPaymentReminders: settings.send_payment_reminders,
          emailTemplates,
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        } as TenantNotificationSettings;
      } catch (error) {
        console.error("Error in useTenantNotifications:", error);
        throw error;
      }
    },
    enabled: isPlatformAdmin,
  });
  
  // Update notification settings
  const { mutateAsync: updateNotificationSettings, isPending: isUpdatingSettings } = useMutation({
    mutationFn: async (updatedSettings: Partial<TenantNotificationSettings>) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const settingsData = {
        branch_id: currentTenant,
        from_email: updatedSettings.fromEmail,
        reply_to_email: updatedSettings.replyToEmail,
        email_footer: updatedSettings.emailFooter,
        send_welcome_email: updatedSettings.sendWelcomeEmail,
        send_invoice_email: updatedSettings.sendInvoiceEmail,
        send_class_reminders: updatedSettings.sendClassReminders,
        send_payment_reminders: updatedSettings.sendPaymentReminders,
        updated_at: new Date().toISOString(),
      };
      
      if (notifications?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from("branch_notifications")
          .update(settingsData)
          .eq("id", notifications.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("branch_notifications")
          .insert({
            ...settingsData,
            created_at: new Date().toISOString(),
          })
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications", currentTenant] });
    }
  });
  
  // Update email template
  const { mutateAsync: updateEmailTemplateFunc, isPending: isUpdatingTemplate } = useMutation({
    mutationFn: async (params: { templateType: string, templateData: { subject: string; content: string }}) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const { templateType, templateData } = params;
      
      // Check if template exists
      const template = notifications?.emailTemplates?.find(t => t.type === templateType);
      
      if (template?.id) {
        // Update existing template
        const { data, error } = await supabase
          .from("branch_email_templates")
          .update({
            subject: templateData.subject,
            content: templateData.content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", template.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from("branch_email_templates")
          .insert({
            branch_id: currentTenant,
            type: templateType,
            subject: templateData.subject,
            content: templateData.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications", currentTenant] });
    }
  });
  
  // Create a wrapper function with the correct signature
  const updateEmailTemplate = async (templateType: string, templateData: { subject: string; content: string }) => {
    return updateEmailTemplateFunc({ templateType, templateData });
  };
  
  return {
    notifications,
    isLoading: isLoading || isUpdatingSettings || isUpdatingTemplate,
    currentTenant,
    setCurrentTenant,
    updateNotificationSettings,
    updateEmailTemplate
  };
}
