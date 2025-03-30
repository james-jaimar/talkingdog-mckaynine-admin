
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { BranchLocationFields } from "./form-sections/BranchLocationFields";
import { BranchContactFields } from "./form-sections/BranchContactFields";
import { BranchAdminFields } from "./form-sections/BranchAdminFields";
import { branchFormSchema, defaultBranchFormValues, BranchFormValues } from "./schemas/branchFormSchema";

interface AddBranchFormProps {
  onSuccess: () => void;
}

export function AddBranchForm({ onSuccess }: AddBranchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: defaultBranchFormValues,
  });
  
  const onSubmit = async (values: BranchFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Ensure capacity is a number before sending to API
      const capacity = typeof values.capacity === 'string' 
        ? parseInt(values.capacity as string, 10) || 10 
        : values.capacity || 10;
      
      const { error } = await supabase.from("branches").insert({
        name: values.name,
        address: values.address,
        city: values.city,
        postal_code: values.postalCode,
        email: values.email || null,
        phone: values.phone || null,
        capacity: capacity,
        admin_id: values.adminId || null,
      });
      
      if (error) throw error;
      
      toast({
        title: "Branch added successfully",
        description: `${values.name} has been added as a new branch.`,
      });
      
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["branches-with-trainers"] });
      onSuccess();
    } catch (error) {
      console.error("Error adding branch:", error);
      toast({
        title: "Failed to add branch",
        description: String(error) || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <BranchLocationFields control={form.control} />
        <BranchContactFields control={form.control} />
        <BranchAdminFields control={form.control} />
        
        <Button 
          type="submit" 
          className="w-full bg-mckaynine-600 hover:bg-mckaynine-700" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding Branch..." : "Add Branch"}
        </Button>
      </form>
    </Form>
  );
}
