
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { safeTableQuery } from "@/lib/supabaseUtils";

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

// Parameter type for updateEmailTemplate
type UpdateEmailTemplateParams = [
  string, // templateType
  { subject: string; content: string } // templateData
];

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
        
        // Use try/catch to handle the case where the table doesn't exist yet
        try {
          // Try to get notification settings using the utility function
          const settings = await safeTableQuery(
            async () => supabase
              .from("branch_notifications")
              .select("*")
              .eq("branch_id", currentTenant)
              .maybeSingle(),
            null
          );
          
          if (settings) {
            const typedSettings = settings as unknown as BranchNotification;
            notificationSettings = {
              id: typedSettings.id,
              tenantId: typedSettings.branch_id,
              fromEmail: typedSettings.from_email || "",
              replyToEmail: typedSettings.reply_to_email || "",
              emailFooter: typedSettings.email_footer || "",
              sendWelcomeEmail: typedSettings.send_welcome_email !== undefined ? typedSettings.send_welcome_email : true,
              sendInvoiceEmail: typedSettings.send_invoice_email !== undefined ? typedSettings.send_invoice_email : true,
              sendClassReminders: typedSettings.send_class_reminders !== undefined ? typedSettings.send_class_reminders : true,
              sendPaymentReminders: typedSettings.send_payment_reminders !== undefined ? typedSettings.send_payment_reminders : true,
              createdAt: typedSettings.created_at,
              updatedAt: typedSettings.updated_at,
              emailTemplates: [] // Will be populated below
            };
          }
        } catch (error) {
          console.error("Error fetching branch_notifications:", error);
        }
        
        try {
          // Try to get email templates
          const templates = await safeTableQuery(
            async () => supabase
              .from("branch_email_templates")
              .select("*")
              .eq("branch_id", currentTenant),
            []
          );
          
          if (templates && templates.length > 0) {
            notificationSettings.emailTemplates = templates.map((template: any) => {
              const typedTemplate = template as unknown as BranchEmailTemplate;
              return {
                id: typedTemplate.id,
                tenantId: typedTemplate.branch_id,
                type: typedTemplate.type,
                subject: typedTemplate.subject,
                content: typedTemplate.content,
                createdAt: typedTemplate.created_at,
                updatedAt: typedTemplate.updated_at
              } as EmailTemplate;
            });
          }
        } catch (error) {
          console.error("Error fetching branch_email_templates:", error);
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
        
        // Check if the branch_notifications table exists
        try {
          const { error: checkError } = await supabase
            .from("branch_notifications")
            .select("id")
            .limit(1);
            
          const tableExists = !checkError || checkError.code !== '42P01';
          
          if (!tableExists) {
            console.log("branch_notifications table doesn't exist yet");
            return [];
          }
          
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
          if ((error as PostgrestError).code === "42P01") {
            console.error("branch_notifications table does not exist:", error);
            // Just return success as we can't update what doesn't exist
            return [];
          }
          throw error;
        }
      } catch (error) {
        console.error("Error updating notification settings:", error);
        return [];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications", currentTenant] });
    }
  });
  
  // Update email template - Now correctly typed as an array parameter
  const { mutateAsync: updateEmailTemplate, isPending: isUpdatingTemplate } = useMutation({
    mutationFn: async (params: UpdateEmailTemplateParams) => {
      if (!currentTenant) throw new Error("No tenant selected");
      
      const templateType = params[0];
      const templateData = params[1];
      
      try {
        // Check if the branch_email_templates table exists
        try {
          const { error: checkError } = await supabase
            .from("branch_email_templates")
            .select("id")
            .limit(1);
            
          const tableExists = !checkError || checkError.code !== '42P01';
          
          if (!tableExists) {
            console.log("branch_email_templates table doesn't exist yet");
            return [];
          }
          
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
          if ((error as PostgrestError).code === "42P01") {
            console.error("branch_email_templates table does not exist:", error);
            // Just return success as we can't update what doesn't exist
            return [];
          }
          throw error;
        }
      } catch (error) {
        console.error("Error updating email template:", error);
        return [];
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
