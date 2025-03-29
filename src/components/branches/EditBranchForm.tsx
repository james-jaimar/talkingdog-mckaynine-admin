
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
import { branchFormSchema, BranchFormValues } from "./schemas/branchFormSchema";

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  email: string | null;
  capacity: number | null;
}

interface EditBranchFormProps {
  branch: Branch;
  onSuccess: () => void;
}

export function EditBranchForm({ branch, onSuccess }: EditBranchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Map branch data to form values
  const defaultValues: BranchFormValues = {
    name: branch.name,
    address: branch.address,
    city: branch.city,
    postalCode: branch.postal_code,
    email: branch.email || "",
    phone: branch.phone || "",
    capacity: branch.capacity || 10,
  };
  
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues,
  });
  
  const onSubmit = async (values: BranchFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("branches")
        .update({
          name: values.name,
          address: values.address,
          city: values.city,
          postal_code: values.postalCode,
          email: values.email || null,
          phone: values.phone || null,
          capacity: values.capacity || 10,
        })
        .eq("id", branch.id);
      
      if (error) throw error;
      
      toast({
        title: "Branch updated successfully",
        description: `${values.name} has been updated.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["branches-with-trainers"] });
      onSuccess();
    } catch (error) {
      console.error("Error updating branch:", error);
      toast({
        title: "Failed to update branch",
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
        
        <div className="text-sm text-muted-foreground mt-2 mb-4">
          <p>* Admin assignment feature will be available once the database schema is updated.</p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-mckaynine-600 hover:bg-mckaynine-700" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating Branch..." : "Update Branch"}
        </Button>
      </form>
    </Form>
  );
}
