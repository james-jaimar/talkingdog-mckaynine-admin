
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { ClassSchedule } from "../types/classSchedule";
import { useClassScheduleDateUtils } from "./useClassScheduleDateUtils";

interface ScheduleSubmitProps {
  classId: string;
  schedule: ClassSchedule | null;
  onSuccess: () => void;
}

export function useScheduleSubmit({ classId, schedule, onSuccess }: ScheduleSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { combineDateTime } = useClassScheduleDateUtils();
  
  const onSubmit = async (values: ClassScheduleFormValues) => {
    setIsSubmitting(true);
    console.log("Form values submitted:", values);
    
    try {
      // Ensure dates are selected
      if (!values.selectedDates || values.selectedDates.length === 0) {
        throw new Error("Please select at least one class date");
      }
      
      // Use the first and last selected dates for start and end
      const sortedDates = [...values.selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      // Combine date and time into ISO strings
      const startDateTime = combineDateTime(firstDate, values.startTime);
      const endDateTime = combineDateTime(
        values.selectedDates.length > 1 ? lastDate : firstDate, 
        values.endTime
      );
      
      // Validate end time is after start time for same-day events
      if (firstDate.toDateString() === lastDate.toDateString() && 
          endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }
      
      // Convert selected dates to ISO strings for storage
      // Ensure proper date formatting for Supabase
      const selectedDatesISO = values.selectedDates.map(date => {
        // Create a new date to avoid timezone issues
        const d = new Date(date);
        return d.toISOString();
      });
      
      console.log("Selected dates (ISO):", selectedDatesISO);
      console.log("Start datetime:", startDateTime.toISOString());
      console.log("End datetime:", endDateTime.toISOString());
      
      const scheduleData = {
        class_id: classId,
        trainer_id: values.trainerId || null, // Allow null trainer
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        recurring: values.isRecurring,
        recurrence_pattern: values.referenceTitle,
        selected_dates: selectedDatesISO,
      };
      
      console.log("Submitting schedule data:", scheduleData);
      
      let response;
      
      if (schedule) {
        // Update existing schedule
        response = await supabase
          .from("class_schedules")
          .update(scheduleData)
          .eq("id", schedule.id);
        
        if (response.error) throw response.error;
        
        toast({
          title: "Schedule updated successfully",
          description: `The schedule has been updated.`,
        });
      } else {
        // Create new schedule
        response = await supabase
          .from("class_schedules")
          .insert(scheduleData);
        
        if (response.error) throw response.error;
        
        toast({
          title: "Schedule created successfully",
          description: `The schedule has been added.`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["class-schedules", classId] });
      onSuccess();
    } catch (error) {
      console.error("Error saving schedule:", error);
      
      // Improved error handling with better messages
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error objects
        errorMessage = JSON.stringify(error);
        
        // Extract message from Supabase error object if possible
        if ('message' in error) {
          errorMessage = String(error.message);
        }
      }
      
      toast({
        title: "Failed to save schedule",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    isSubmitting,
    onSubmit
  };
}
