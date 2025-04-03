
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientData } from "@/hooks/useCustomerProfileData";

// Define the validation schema
const profileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Phone number should be at least 10 digits",
    }),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z
    .string()
    .optional()
    .refine((val) => !val || /^[A-Za-z0-9\s-]+$/.test(val), {
      message: "Invalid postal code format",
    }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export function useCustomerProfileForm(client: ClientData, onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      postal_code: client.postal_code || "",
    },
    mode: "onBlur", // Validate fields when they lose focus
  });

  const resetForm = () => {
    form.reset({
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      postal_code: client.postal_code || "",
    });
    setFormError(null);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      console.log("Updating profile for client ID:", client.id);
      console.log("Update data:", data);
      
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
        })
        .eq('id', client.id);
        
      if (error) {
        console.error("Database error:", error);
        setFormError(error.message || "Failed to update profile");
        toast("Error updating profile", {
          description: error.message || "There was a problem updating your profile. Please try again.",
        });
        throw error;
      }
      
      toast("Profile updated", {
        description: "Your profile has been updated successfully.",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error updating profile:", error);
      // Error is already handled above
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    formError,
    resetForm,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
