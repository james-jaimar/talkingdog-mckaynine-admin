
import { useState } from "react";
import { ClassFormValues } from "../../schemas/classFormSchema";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTerm } from "@/context/TermContext";
import { ClassData } from "./types";
import { showClassCreatedToast, showClassUpdatedToast, showClassErrorToast } from "../utils/toast-actions";

export function useClassSubmit(classData: ClassData | null, onSuccess?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { termData } = useTerm();
  const navigate = useNavigate();

  const onSubmit = async (values: ClassFormValues) => {
    setIsSubmitting(true);
    console.log("Submitting form with values:", values);
    
    // Add validation for branch ID
    if (!values.branchId) {
      toast({
        title: "Branch is required",
        description: "Please select a branch for this class.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Log if we have termData available
    console.log("Current termData during class submission:", termData);
    
    try {
      let classId: string;
      
      if (classData) {
        // Update existing class
        const { data: updatedClass, error } = await supabase
          .from("classes")
          .update({
            name: values.name,
            description: values.description,
            class_type: values.class_type,
            course_fee: values.course_fee,
            enrollment_fee: values.enrollment_fee,
            mckaynine_commission_type: values.mckaynine_commission_type,
            mckaynine_commission_value: values.mckaynine_commission_value, 
            admin_fee_type: values.admin_fee_type,
            admin_fee_value: values.admin_fee_value,
            trainer_fee_type: values.trainer_fee_type,
            trainer_fee_value: values.trainer_fee_value,
            duration: values.duration,
            capacity: values.capacity,
            branch_id: values.branchId,
          })
          .eq("id", classData.id)
          .select()
          .single();
        
        if (error) throw error;
        classId = classData.id;
        
        showClassUpdatedToast(values.name);
      } else {
        // Create new class
        console.log("Creating new class with branch:", values.branchId);
        const { data: newClass, error } = await supabase
          .from("classes")
          .insert({
            name: values.name,
            description: values.description,
            class_type: values.class_type,
            course_fee: values.course_fee,
            enrollment_fee: values.enrollment_fee,
            mckaynine_commission_type: values.mckaynine_commission_type,
            mckaynine_commission_value: values.mckaynine_commission_value, 
            admin_fee_type: values.admin_fee_type,
            admin_fee_value: values.admin_fee_value,
            trainer_fee_type: values.trainer_fee_type,
            trainer_fee_value: values.trainer_fee_value,
            duration: values.duration,
            capacity: values.capacity,
            branch_id: values.branchId,
          })
          .select()
          .single();
        
        if (error) {
          console.error("Database error creating class:", error);
          throw error;
        }
        
        if (!newClass) {
          throw new Error("Failed to retrieve the newly created class data");
        }
        
        classId = newClass.id;
        console.log("Successfully created class with ID:", classId);
        
        // Show success toast without depending on navigation from the toast
        showClassCreatedToast(values.name, classId);
        
        // Directly navigate to schedule creation page
        console.log(`Navigating to schedule creation for class ${classId}`);
        setTimeout(() => {
          navigate(`/classes/${classId}/schedules`);
        }, 500);
      }
      
      // Invalidate all class-related queries to ensure UI is updated
      console.log("Invalidating class queries...");
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      
      // If a term is selected, also invalidate any term-specific queries
      if (termData?.id) {
        console.log(`Invalidating term-specific queries for term ${termData.id}...`);
        await queryClient.invalidateQueries({ 
          queryKey: ["classes", termData.id]
        });
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        console.log("Calling onSuccess callback");
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error saving class:", error);
      showClassErrorToast(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting };
}
