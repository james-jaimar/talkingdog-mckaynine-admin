
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/context/BranchContext";
import { handlerFormSchema, type FormValues } from "./form/handlerFormSchema";
import { BasicInfoFields } from "./form/BasicInfoFields";
import { ContactInfoFields } from "./form/ContactInfoFields";
import { AddressFields } from "./form/AddressFields";
import { NotesField } from "./form/NotesField";
import { SecondaryContactFields } from "./form/SecondaryContactFields";

interface HandlerData {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: string;
  secondary_first_name?: string;
  secondary_last_name?: string;
  secondary_email?: string;
  secondary_phone?: string;
  uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
  social_media_consent_status: 'yes' | 'no' | 'not_marked';
}

interface EditHandlerFormProps {
  handler: HandlerData;
  onSuccess?: () => void;
}

export function EditHandlerForm({ handler, onSuccess }: EditHandlerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { branches } = useBranch();

  console.log("EditHandlerForm received handler:", handler);

  // Initialize form with handler data
  const form = useForm<FormValues>({
    resolver: zodResolver(handlerFormSchema),
    defaultValues: {
      first_name: handler?.first_name || "",
      last_name: handler?.last_name || "",
      email: handler?.email || "",
      phone: handler?.phone || "",
      address: handler?.address || "",
      city: handler?.city || "",
      postal_code: handler?.postal_code || "",
      notes: handler?.notes || "",
      branch_id: handler?.branch_id || "",
      secondary_first_name: handler?.secondary_first_name || "",
      secondary_last_name: handler?.secondary_last_name || "",
      secondary_email: handler?.secondary_email || "",
      secondary_phone: handler?.secondary_phone || "",
      uses_whatsapp_status: handler?.uses_whatsapp_status || 'not_marked',
      social_media_consent_status: handler?.social_media_consent_status || 'not_marked',
    },
  });

  // Check if secondary contact has any data
  const hasSecondaryContact = !!(
    handler?.secondary_first_name || 
    handler?.secondary_last_name || 
    handler?.secondary_email || 
    handler?.secondary_phone
  );

  // Update form when handler data changes
  useEffect(() => {
    if (handler) {
      console.log("Resetting form with handler data:", handler);
      form.reset({
        first_name: handler.first_name,
        last_name: handler.last_name || "",
        email: handler.email || "",
        phone: handler.phone || "",
        address: handler.address || "",
        city: handler.city || "",
        postal_code: handler.postal_code || "",
        notes: handler.notes || "",
        branch_id: handler.branch_id || "",
        secondary_first_name: handler.secondary_first_name || "",
        secondary_last_name: handler.secondary_last_name || "",
        secondary_email: handler.secondary_email || "",
        secondary_phone: handler.secondary_phone || "",
        uses_whatsapp_status: handler.uses_whatsapp_status,
        social_media_consent_status: handler.social_media_consent_status,
      });
    }
  }, [handler, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    console.log("Submitting form with values:", values);
    console.log("Handler ID:", handler.id);
    
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: values.first_name,
          last_name: values.last_name || "",
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          postal_code: values.postal_code,
          notes: values.notes,
          branch_id: values.branch_id || null,
          secondary_first_name: values.secondary_first_name || null,
          secondary_last_name: values.secondary_last_name || null,
          secondary_email: values.secondary_email || null,
          secondary_phone: values.secondary_phone || null,
          uses_whatsapp_status: values.uses_whatsapp_status,
          social_media_consent_status: values.social_media_consent_status,
        })
        .eq("id", handler.id);

      if (error) throw error;

      toast({
        title: "Handler updated",
        description: "The handler information has been updated successfully",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating handler:", error);
      toast({
        variant: "destructive",
        title: "Failed to update handler",
        description: "There was an error updating the handler information",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <BasicInfoFields control={form.control} />
        <ContactInfoFields control={form.control} branches={branches} />
        <AddressFields control={form.control} />
        <SecondaryContactFields control={form.control} hasData={hasSecondaryContact} />
        <NotesField control={form.control} />
        
        {/* WhatsApp and Social Media consent are now managed via enrollment forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">WhatsApp Status</p>
            <p className="text-sm text-muted-foreground italic">
              Managed via enrollment form
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Social Media Consent</p>
            <p className="text-sm text-muted-foreground italic">
              Managed via enrollment form
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
