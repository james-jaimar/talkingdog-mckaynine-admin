import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientData } from "@/hooks/useCustomerProfileData";

// Update the validation schema to use a single name field
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
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
  
  // Combine first and last name for the form
  const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: fullName,
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
      name: fullName,
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
      
      // Split name into first_name for database (keep all in first_name field)
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: data.name,
          last_name: "", // Clear the last name field as we're only using the name field
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
