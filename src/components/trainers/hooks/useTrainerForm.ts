
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Trainer } from "../types/trainer";
import { trainerFormSchema, TrainerFormValues } from "../schemas/trainerFormSchema";

// Simple branch option type
type BranchOption = {
  label: string;
  value: string;
};

export function useTrainerForm(trainer: Trainer, onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get the branch ID value, handling different formats
  let initialBranchIds: string[] = [];
  if (trainer.branch_id) {
    initialBranchIds = [trainer.branch_id];
  } else if (Array.isArray(trainer.branch_ids) && trainer.branch_ids.length > 0) {
    initialBranchIds = trainer.branch_ids;
  }

  console.log("[useTrainerForm] Initial branch IDs:", initialBranchIds);
  
  // Pre-populate form with trainer data
  const defaultValues: TrainerFormValues = {
    firstName: trainer.first_name || "",
    lastName: trainer.last_name || "",
    email: trainer.email || "",
    phone: trainer.phone || "",
    branchIds: initialBranchIds,
    specialties: Array.isArray(trainer.specialties) ? trainer.specialties : [],
    bio: trainer.bio || "",
  };

  console.log("[useTrainerForm] Default values:", defaultValues);
  
  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues,
  });
  
  // Fetch branches for dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        console.log("[useTrainerForm] Fetching branches...");
        
        const { data, error } = await supabase
          .from("branches")
          .select("id, name")
          .order("name");
        
        if (error) {
          console.error("[useTrainerForm] Error fetching branches:", error);
          throw error;
        }
        
        if (data && Array.isArray(data)) {
          const branchOptions = data.map(branch => ({
            value: branch.id,
            label: branch.name
          }));
          
          console.log("[useTrainerForm] Loaded branch options:", branchOptions);
          setBranches(branchOptions);
        } else {
          console.log("[useTrainerForm] No branch data found");
          setBranches([]);
        }
      } catch (error) {
        console.error("[useTrainerForm] Exception in fetchBranches:", error);
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
  
  const onSubmit = async (values: TrainerFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("[useTrainerForm] Submitting trainer form with values:", values);
      
      // Update using the correct field name (branch_id not branch_ids)
      const { error } = await supabase
        .from("trainers")
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone: values.phone || null,
          branch_id: values.branchIds.length > 0 ? values.branchIds[0] : null,
          specialties: values.specialties.length > 0 ? values.specialties : [],
          bio: values.bio || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", trainer.id);
      
      if (error) throw error;
      
      toast({
        title: "Trainer updated successfully",
        description: `${values.firstName} ${values.lastName}'s information has been updated.`,
      });
      
      // Invalidate multiple related queries to ensure data is fresh
      const queriesToInvalidate = [
        ['trainers'],
        ['trainers-list'],
        ['trainers-admin'],
        ['trainer', trainer.id]
      ];
      
      // If this trainer is also a user, invalidate user queries too
      if (trainer.user_id) {
        queriesToInvalidate.push(['users'], ['users-admin']);
      }
      
      queriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      onSuccess();
    } catch (error) {
      console.error("[useTrainerForm] Error updating trainer:", error);
      toast({
        title: "Failed to update trainer",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
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
