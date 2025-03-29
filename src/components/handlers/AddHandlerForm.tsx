
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { HandlerPersonalInfoFields } from "./form/HandlerPersonalInfoFields";
import { DogInfoFields } from "./form/DogInfoFields";
import { ClassAndPreferencesFields } from "./form/ClassAndPreferencesFields";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  dogName: z.string().min(1, {
    message: "Dog name is required.",
  }),
  breed: z.string().min(1, {
    message: "Breed is required.",
  }),
  dogDob: z.string().optional(),
  assessment: z.string().optional(),
  comments: z.string().optional(),
  whatsApp: z.boolean().default(false),
  photoPermission: z.boolean().default(false),
  classEnrollment: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddHandlerFormProps {
  onSuccess: () => void;
}

export function AddHandlerForm({ onSuccess }: AddHandlerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dogName: "",
      breed: "",
      dogDob: "",
      assessment: "",
      comments: "",
      whatsApp: false,
      photoPermission: false,
      classEnrollment: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      // Insert client data
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          notes: data.comments || null,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      // Insert dog data
      const { error: dogError } = await supabase.from("dogs").insert({
        name: data.dogName,
        breed: data.breed,
        client_id: clientData.id,
        behavior_notes: data.assessment || null,
        notes: `${data.classEnrollment ? `Class: ${data.classEnrollment}` : ""}
WhatsApp: ${data.whatsApp ? "Yes" : "No"}
Photo Permission: ${data.photoPermission ? "Yes" : "No"}`,
      });

      if (dogError) throw dogError;

      toast({
        title: "Handler added successfully",
        description: "The new handler and dog have been added to the system.",
      });

      // Refresh the handlers list
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
      
      // Close the modal
      onSuccess();
    } catch (error) {
      console.error("Error adding handler:", error);
      toast({
        title: "Failed to add handler",
        description: "There was an error adding the handler. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <HandlerPersonalInfoFields control={form.control} />
        
        <DogInfoFields control={form.control} />
        
        <ClassAndPreferencesFields control={form.control} />

        <Button
          type="submit"
          className="w-full bg-mckaynine-600 hover:bg-mckaynine-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding Handler..." : "Add Handler"}
        </Button>
      </form>
    </Form>
  );
}
