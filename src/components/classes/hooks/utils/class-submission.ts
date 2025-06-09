
import { supabase } from "@/integrations/supabase/client";
import { ClassFormValues } from "../../schemas/classFormSchema";
import { Class } from "../../types/class";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { useTerm } from "@/context/TermContext";
import { useBranch } from "@/context/BranchContext";
import { useNavigate } from "react-router-dom";
import {
  showClassCreatedToast,
  showClassUpdatedToast,
  showClassErrorToast
} from "./toast-actions";

type ClassData = Class | ClassWithSchedules;

export function useClassSubmission() {
  const queryClient = useQueryClient();
  const { termData } = useTerm();
  const { currentBranch } = useBranch();
  const navigate = useNavigate();

  const submitClass = async (values: ClassFormValues, classData: ClassData | null, onSuccess?: () => void) => {
    console.log("DEBUG: Submitting form with values:", values);
    console.log("DEBUG: Description type:", typeof values.description);
    console.log("DEBUG: Description value:", values.description);
    console.log("DEBUG: Description === null:", values.description === null);
    console.log("DEBUG: Description === undefined:", values.description === undefined);
    
    // Validate branch ID
    if (!values.branchId) {
      throw new Error("Branch is required. Please select a branch for this class.");
    }
    
    // Extra safety: Ensure description is always a string
    const description = typeof values.description === 'string' ? values.description : "";
    
    // Prepare class payload
    const classPayload = {
      name: values.name.trim(),
      description: description,
      class_type: values.class_type,
      course_fee: Number(values.course_fee),
      enrollment_fee: Number(values.enrollment_fee),
      mckaynine_commission_type: values.mckaynine_commission_type,
      mckaynine_commission_value: Number(values.mckaynine_commission_value), 
      admin_fee_type: values.admin_fee_type,
      admin_fee_value: Number(values.admin_fee_value),
      trainer_fee_type: values.trainer_fee_type,
      trainer_fee_value: Number(values.trainer_fee_value),
      duration: Number(values.duration),
      capacity: Number(values.capacity),
      branch_id: values.branchId,
    };
    
    if (classData) {
      // Update existing class
      const { data: updatedClass, error } = await supabase
        .from("classes")
        .update(classPayload)
        .eq("id", classData.id)
        .select()
        .single();
      
      if (error) {
        console.error("DEBUG: Database error updating class:", error);
        throw error;
      }
      showClassUpdatedToast(values.name);
    } else {
      // Create new class
      const { data: newClass, error } = await supabase
        .from("classes")
        .insert(classPayload)
        .select()
        .single();
      
      if (error) {
        console.error("DEBUG: Database error creating class:", error);
        throw error;
      }
      
      if (!newClass) {
        throw new Error("Failed to retrieve the newly created class data");
      }
      
      console.log("DEBUG: Successfully created class:", newClass);
      showClassCreatedToast(values.name, newClass.id, navigate);
      
      // Navigate to schedule creation after a short delay
      setTimeout(() => {
        navigate(`/classes/${newClass.id}/schedules`);
      }, 500);
    }
    
    // Comprehensive cache invalidation to ensure UI updates immediately
    await Promise.all([
      // Invalidate all classes queries for the current branch
      queryClient.invalidateQueries({ 
        queryKey: ["classes", currentBranch?.id],
        exact: false 
      }),
      // Invalidate classes queries with term data
      queryClient.invalidateQueries({ 
        queryKey: ["classes", currentBranch?.id, termData?.id],
        exact: false 
      }),
      // Invalidate general classes queries
      queryClient.invalidateQueries({ 
        queryKey: ["classes"],
        exact: false 
      }),
      // Invalidate class tab order
      queryClient.invalidateQueries({ 
        queryKey: ["class-tab-order"],
        exact: false 
      }),
      // Invalidate dashboard stats that might show class counts
      queryClient.invalidateQueries({ 
        queryKey: ["dashboard-stats"],
        exact: false 
      })
    ]);
    
    // Force immediate refetch of classes data
    if (currentBranch?.id) {
      await queryClient.refetchQueries({ 
        queryKey: ["classes", currentBranch.id],
        exact: false 
      });
    }
    
    // Call success callback
    if (onSuccess) {
      onSuccess();
    }
  };

  return { submitClass };
}
