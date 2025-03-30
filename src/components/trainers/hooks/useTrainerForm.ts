
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Trainer } from "../types/trainer";
import { trainerFormSchema, TrainerFormValues } from "../schemas/trainerFormSchema";
import { OptionType } from "@/components/ui/multi-select";

export function useTrainerForm(trainer: Trainer, onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<OptionType[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Pre-populate form with trainer data
  const defaultValues: TrainerFormValues = {
    firstName: trainer.first_name,
    lastName: trainer.last_name,
    email: trainer.email,
    phone: trainer.phone || "",
    branchIds: Array.isArray(trainer.branch_ids) ? trainer.branch_ids : [],
    specialties: Array.isArray(trainer.specialties) ? trainer.specialties : [],
    bio: trainer.bio || "",
  };
  
  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues,
  });
  
  // Fetch branches for dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        console.log("Fetching branches for trainer form...");
        
        const { data, error } = await supabase
          .from("branches")
          .select("id, name")
          .order("name");
        
        if (error) {
          console.error("Error fetching branches:", error);
          throw error;
        }
        
        console.log("Raw branches data:", data);
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Map branch data to OptionType format and ensure valid structure
          const branchOptions = data.map(branch => {
            // Ensure each branch has an id and name
            if (!branch || !branch.id || !branch.name) {
              console.warn("Invalid branch data:", branch);
              return null;
            }
            return {
              value: branch.id,
              label: branch.name
            };
          }).filter(Boolean) as OptionType[]; // Remove null entries
          
          console.log("Converted branch options:", branchOptions);
          setBranches(branchOptions);
        } else {
          console.warn("No branches data received or empty array:", data);
          setBranches([]);
        }
      } catch (error) {
        console.error("Exception in fetchBranches:", error);
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
  
  // Log state changes for debugging
  useEffect(() => {
    console.log("Current branches state:", branches);
  }, [branches]);
  
  const onSubmit = async (values: TrainerFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Submitting trainer form with values:", values);
      
      const { error } = await supabase
        .from("trainers")
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone: values.phone || null,
          branch_ids: values.branchIds.length > 0 ? values.branchIds : null,
          specialties: values.specialties.length > 0 ? values.specialties : null,
          bio: values.bio || null,
        })
        .eq("id", trainer.id);
      
      if (error) throw error;
      
      toast({
        title: "Trainer updated successfully",
        description: `${values.firstName} ${values.lastName}'s information has been updated.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      onSuccess();
    } catch (error) {
      console.error("Error updating trainer:", error);
      toast({
        title: "Failed to update trainer",
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
