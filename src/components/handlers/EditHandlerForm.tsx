
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/context/BranchContext";
import { handlerFormSchema, type FormValues } from "./form/handlerFormSchema";
import { BasicInfoFields } from "./form/BasicInfoFields";
import { ContactInfoFields } from "./form/ContactInfoFields";
import { AddressFields } from "./form/AddressFields";
import { NotesField } from "./form/NotesField";

interface HandlerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: string;
}

interface EditHandlerFormProps {
  handler: HandlerData;
  onSuccess?: () => void;
}

export function EditHandlerForm({ handler, onSuccess }: EditHandlerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { branches } = useBranch();

  // Initialize form with handler data
  const form = useForm<FormValues>({
    resolver: zodResolver(handlerFormSchema),
    defaultValues: {
      first_name: handler.first_name,
      last_name: handler.last_name,
      email: handler.email,
      phone: handler.phone || "",
      address: handler.address || "",
      city: handler.city || "",
      postal_code: handler.postal_code || "",
      notes: handler.notes || "",
      branch_id: handler.branch_id || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          postal_code: values.postal_code,
          notes: values.notes,
          branch_id: values.branch_id || null,
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
        <NotesField control={form.control} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
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
