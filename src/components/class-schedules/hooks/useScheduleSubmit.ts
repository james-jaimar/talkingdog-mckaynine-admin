
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useQueryClient } from "@tanstack/react-query";
import { prepareScheduleData } from "./schedule-submission/prepareScheduleData";
import { handleSingleTermSubmission } from "./schedule-submission/singleTermSubmission";
import { UseScheduleSubmitProps } from "./schedule-submission/types";

export function useScheduleSubmit({ 
  classId, 
  schedule, 
  onSuccess,
}: UseScheduleSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onSubmit = async (data: ClassScheduleFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log("Starting schedule submission with data:", data);
      console.log("For class ID:", classId);
      console.log("User-selected term_id:", data.termId);
      
      const baseScheduleData = await prepareScheduleData(data, classId);
      
      await handleSingleTermSubmission(
        baseScheduleData, 
        schedule?.id || null, 
        toast
      );

      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ["class-schedules"],
          refetchType: 'none'
        });
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
