
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
    console.log("DEBUG: Final description value being sent:", description);
    console.log("DEBUG: Final description type:", typeof description);
    
    // Prepare class payload
    const classPayload = {
      name: values.name.trim(),
      description: description, // Guaranteed string
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

    console.log("DEBUG: Final class payload being sent to database:", classPayload);
    console.log("DEBUG: Payload description type:", typeof classPayload.description);
    console.log("DEBUG: Payload description value:", classPayload.description);
    
    if (classData) {
      // Update existing class
      console.log("DEBUG: Updating existing class with ID:", classData.id);
      const { data: updatedClass, error } = await supabase
        .from("classes")
        .update(classPayload)
        .eq("id", classData.id)
        .select()
        .single();
      
      if (error) {
        console.error("DEBUG: Database error updating class:", error);
        console.error("DEBUG: Error details:", JSON.stringify(error, null, 2));
        throw error;
      }
      showClassUpdatedToast(values.name);
    } else {
      // Create new class
      console.log("DEBUG: Creating new class");
      const { data: newClass, error } = await supabase
        .from("classes")
        .insert(classPayload)
        .select()
        .single();
      
      if (error) {
        console.error("DEBUG: Database error creating class:", error);
        console.error("DEBUG: Error details:", JSON.stringify(error, null, 2));
        console.error("DEBUG: Payload that caused error:", JSON.stringify(classPayload, null, 2));
        throw error;
      }
      
      if (!newClass) {
        throw new Error("Failed to retrieve the newly created class data");
      }
      
      console.log("DEBUG: Successfully created class:", newClass);
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
