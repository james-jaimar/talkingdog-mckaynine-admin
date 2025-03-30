
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Class } from "../types/class";
import { classFormSchema, ClassFormValues } from "../schemas/classFormSchema";

// Branch option type
type BranchOption = {
  label: string;
  value: string;
};

export function useClassForm(classData: Class | null, onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Pre-populate form with class data or set defaults
  const defaultValues: ClassFormValues = classData
    ? {
        name: classData.name,
        description: classData.description,
        level: classData.level,
        price: classData.price,
        duration: classData.duration,
        capacity: classData.capacity,
        branchId: classData.branch_id,
      }
    : {
        name: "",
        description: "",
        level: "",
        price: 0,
        duration: 60,
        capacity: 8,
        branchId: "",
      };
  
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues,
  });
  
  // Fetch branches for dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const { data, error } = await supabase
          .from("branches")
          .select("id, name")
          .order("name");
        
        if (error) {
          throw error;
        }
        
        if (data && Array.isArray(data)) {
          const branchOptions = data.map(branch => ({
            value: branch.id,
            label: branch.name
          }));
          
          setBranches(branchOptions);
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast({
          title: "Failed to load branches",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
        setBranches([]);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    
    fetchBranches();
  }, [toast]);
  
  const onSubmit = async (values: ClassFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (classData) {
        // Update existing class
        const { error } = await supabase
          .from("classes")
          .update({
            name: values.name,
            description: values.description,
            level: values.level,
            price: values.price,
            duration: values.duration,
            capacity: values.capacity,
            branch_id: values.branchId,
          })
          .eq("id", classData.id);
        
        if (error) throw error;
        
        toast({
          title: "Class updated successfully",
          description: `${values.name} has been updated.`,
        });
      } else {
        // Create new class
        const { error } = await supabase
          .from("classes")
          .insert({
            name: values.name,
            description: values.description,
            level: values.level,
            price: values.price,
            duration: values.duration,
            capacity: values.capacity,
            branch_id: values.branchId,
          });
        
        if (error) throw error;
        
        toast({
          title: "Class created successfully",
          description: `${values.name} has been added.`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      onSuccess();
    } catch (error) {
      console.error("Error saving class:", error);
      toast({
        title: "Failed to save class",
        description: String(error) || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    form,
    isSubmitting,
    branches,
    isLoadingBranches,
    onSubmit
  };
}
