
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useState, useEffect } from "react";
import { checkTableExists, safeTableQuery } from "@/lib/supabaseUtils";

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

// Interface for branch_notifications to match database schema
interface BranchNotification {
  id: string;
  branch_id: string;
  from_email: string;
  reply_to_email: string;
  email_footer: string;
  send_welcome_email: boolean;
  send_invoice_email: boolean;
  send_class_reminders: boolean;
  send_payment_reminders: boolean;
  created_at: string;
  updated_at: string;
}

// Interface for branch_email_templates to match database schema
interface BranchEmailTemplate {
  id: string;
  branch_id: string;
  type: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Template update type for updateEmailTemplate
type EmailTemplateUpdate = [string, { subject: string; content: string }];

export function useTenantNotifications() {
  const { isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);

  // Check if notifications table exists
  const { data: notificationsTableExists } = useQuery({
    queryKey: ["branch-notifications-table-exists"],
    queryFn: async () => {
      return await checkTableExists(() => 
        supabase.from("branch_notifications").select("id").limit(1)
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Check if email templates table exists
  const { data: templatesTableExists } = useQuery({
    queryKey: ["branch-email-templates-table-exists"],
    queryFn: async () => {
      return await checkTableExists(() => 
        supabase.from("branch_email_templates").select("id").limit(1)
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch notification settings for the current tenant
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["tenant-notifications", currentTenant, notificationsTableExists, templatesTableExists],
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
        // Get branch first to make sure it exists
        const { data: branch, error: branchError } = await supabase
          .from("branches")
          .select("*")
          .eq("id", currentTenant)
          .single();
          
        if (branchError) throw branchError;
        
        // Default notification settings
        let notificationSettings: TenantNotificationSettings = {
          tenantId: currentTenant,
          fromEmail: "",
          replyToEmail: "",
          emailFooter: "",
          sendWelcomeEmail: true,
          sendInvoiceEmail: true,
          sendClassReminders: true,
          sendPaymentReminders: true,
          emailTemplates: []
        };
        
        // If notifications table exists, try to get settings
        if (notificationsTableExists) {
          const settings = await safeTableQuery<BranchNotification | null>(
            () => supabase
              .from("branch_notifications")
              .select("*")
              .eq("branch_id", currentTenant)
              .maybeSingle(),
            null
          );
          
          if (settings) {
            notificationSettings = {
              id: settings.id,
              tenantId: settings.branch_id,
              fromEmail: settings.from_email || "",
              replyToEmail: settings.reply_to_email || "",
              emailFooter: settings.email_footer || "",
              sendWelcomeEmail: settings.send_welcome_email !== undefined ? settings.send_welcome_email : true,
              sendInvoiceEmail: settings.send_invoice_email !== undefined ? settings.send_invoice_email : true,
              sendClassReminders: settings.send_class_reminders !== undefined ? settings.send_class_reminders : true,
              sendPaymentReminders: settings.send_payment_reminders !== undefined ? settings.send_payment_reminders : true,
              createdAt: settings.created_at,
              updatedAt: settings.updated_at,
              emailTemplates: [] // Will be populated below
            };
          }
        }
        
        // If templates table exists, try to get email templates
        if (templatesTableExists) {
          const templates = await safeTableQuery<BranchEmailTemplate[]>(
            () => supabase
              .from("branch_email_templates")
              .select("*")
              .eq("branch_id", currentTenant),
            []
          );
          
          if (templates && templates.length > 0) {
            notificationSettings.emailTemplates = templates.map((template) => {
              return {
                id: template.id,
                tenantId: template.branch_id,
                type: template.type,
                subject: template.subject,
                content: template.content,
                createdAt: template.created_at,
                updatedAt: template.updated_at
              } as EmailTemplate;
            });
          }
        }
        
        return notificationSettings;
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
      
      // If table doesn't exist, just return (can't update what doesn't exist)
      if (notificationsTableExists === false) {
        console.log("branch_notifications table doesn't exist yet");
        return null;
      }
      
      try {
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
      } catch (error) {
        console.error("Error updating notification settings:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications", currentTenant] });
    }
  });
  
  // Update email template 
  const { mutateAsync: updateEmailTemplate, isPending: isUpdatingTemplate } = useMutation({
    mutationFn: async (params: EmailTemplateUpdate) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      // If table doesn't exist, just return (can't update what doesn't exist)
      if (templatesTableExists === false) {
        console.log("branch_email_templates table doesn't exist yet");
        return null;
      }
      
      const templateType = params[0];
      const templateData = params[1];
      
      try {
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
      } catch (error) {
        console.error("Error updating email template:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications", currentTenant] });
    }
  });
  
  return {
    notifications,
    isLoading: isLoading || isUpdatingSettings || isUpdatingTemplate,
    currentTenant,
    setCurrentTenant,
    updateNotificationSettings,
    updateEmailTemplate
  };
}
