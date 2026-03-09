
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useQueryClient } from "@tanstack/react-query";
import { prepareScheduleData } from "./schedule-submission/prepareScheduleData";
import { handleSingleTermSubmission } from "./schedule-submission/singleTermSubmission";
import { handleMultiTermSubmission } from "./schedule-submission/multiTermSubmission";
import { UseScheduleSubmitProps } from "./schedule-submission/types";

export function useScheduleSubmit({ 
  classId, 
  schedule, 
  onSuccess,
  currentTermId,
  selectedYear,
  selectedTermNumber
}: UseScheduleSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onSubmit = async (data: ClassScheduleFormValues) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      console.log("Starting schedule submission with data:", data);
      console.log("For class ID:", classId);
      
      // Prepare the base schedule data (now async to auto-determine term_id)
      const baseScheduleData = await prepareScheduleData(data, classId, currentTermId);
      console.log("Prepared schedule data with term_id:", baseScheduleData.term_id);
      
      // Handle multi-term schedules
      if (data.spansMultipleTerms && data.relatedTermIds && data.relatedTermIds.length > 0) {
        await handleMultiTermSubmission(
          baseScheduleData, 
          data.relatedTermIds, 
          schedule, 
          toast
        );
      } else {
        // Handle single-term schedule (original behavior)
        await handleSingleTermSubmission(
          baseScheduleData, 
          schedule?.id || null, 
          toast
        );
      }

      // Avoid immediate invalidation to prevent recursion
      setTimeout(() => {
        // Invalidate all related queries to ensure UI is updated
        queryClient.invalidateQueries({ 
          queryKey: ["class-schedules"],
          // Disable refetchType to prevent automatic refetches
          refetchType: 'none'
        });
        
        // Wait a moment before triggering success callback
        onSuccess();
      }, 100);
      
    } catch (error) {
      console.error("Error submitting schedule:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    onSubmit,
  };
}
