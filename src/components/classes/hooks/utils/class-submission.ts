
import { supabase } from "@/integrations/supabase/client";
import { ClassFormValues } from "../../schemas/classFormSchema";
import { Class } from "../../types/class";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { useQueryClient } from "@tanstack/react-query";
import { useTerm } from "@/context/TermContext";
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
  const navigate = useNavigate();

  const submitClass = async (values: ClassFormValues, classData: ClassData | null, onSuccess?: () => void) => {
    console.log("Submitting form with values:", values);
    
    // Validate branch ID
    if (!values.branchId) {
      throw new Error("Branch is required. Please select a branch for this class.");
    }
    
    // Prepare class payload with explicit type conversion
    // FIX: Send empty string instead of null for description
    const classPayload = {
      name: values.name.trim(),
      description: values.description?.trim() || "", // Send empty string instead of null
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

    console.log("Submitting class payload:", classPayload);
    
    if (classData) {
      // Update existing class
      const { data: updatedClass, error } = await supabase
        .from("classes")
        .update(classPayload)
        .eq("id", classData.id)
        .select()
        .single();
      
      if (error) {
        console.error("Database error updating class:", error);
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
        console.error("Database error creating class:", error);
        throw error;
      }
      
      if (!newClass) {
        throw new Error("Failed to retrieve the newly created class data");
      }
      
      console.log("Successfully created class:", newClass);
      showClassCreatedToast(values.name, newClass.id);
      
      // Navigate to schedule creation after a short delay
      setTimeout(() => {
        navigate(`/classes/${newClass.id}/schedules`);
      }, 500);
    }
    
    // Invalidate queries to refresh UI
    await queryClient.invalidateQueries({ queryKey: ["classes"] });
    
    if (termData?.id) {
      await queryClient.invalidateQueries({ 
        queryKey: ["classes", termData.id]
      });
    }
    
    // Call success callback
    if (onSuccess) {
      onSuccess();
    }
  };

  return { submitClass };
}
