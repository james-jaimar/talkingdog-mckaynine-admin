
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ClassSchedule } from "../types/classSchedule";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";

interface UseScheduleSubmitProps {
  classId: string;
  schedule: ClassSchedule | null;
  onSuccess: () => void;
}

export function useScheduleSubmit({ 
  classId, 
  schedule, 
  onSuccess 
}: UseScheduleSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: ClassScheduleFormValues) => {
    setIsSubmitting(true);

    try {
      console.log("Submitting schedule data:", data);
      
      // Check if we have selected dates
      if (!data.selectedDates || data.selectedDates.length === 0) {
        throw new Error("Please select at least one date");
      }
      
      // Sort dates to find first and last for start_time and end_time
      const sortedDates = [...data.selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      // Set hours and minutes from time strings
      const [startHour, startMinute] = data.startTime.split(":").map(Number);
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      
      const startDateTime = new Date(firstDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(firstDate); // Use same day for end time
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      // If end time is earlier than start time, assume it's for the next day
      if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      // Calculate end date by adding the same time difference to the last date
      const lastEndDateTime = new Date(lastDate);
      lastEndDateTime.setHours(endHour, endMinute, 0, 0);
      if (lastEndDateTime < lastDate) {
        lastEndDateTime.setDate(lastEndDateTime.getDate() + 1);
      }

      // Instead of using null for trainer_id when "none" is selected,
      // we'll use a special UUID string to represent "no trainer"
      // This works around the not-null constraint in the database
      const DEFAULT_TRAINER_ID = "00000000-0000-0000-0000-000000000000";
      
      // Transform 'none' value to the default trainer ID value
      const trainer_id = data.trainerId === 'none' ? DEFAULT_TRAINER_ID : data.trainerId;
      
      // Create schedule data object
      const scheduleData = {
        class_id: classId,
        trainer_id: trainer_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        recurring: data.isRecurring,
        recurrence_pattern: data.referenceTitle,
        selected_dates: data.selectedDates.map(date => date.toISOString()),
      };

      console.log("Processed schedule data:", scheduleData);

      if (schedule) {
        // Update existing schedule
        const { error } = await supabase
          .from("class_schedules")
          .update(scheduleData)
          .eq("id", schedule.id);
          
        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        
        toast({
          title: "Schedule updated",
          description: "The class schedule has been successfully updated.",
        });
      } else {
        // Create new schedule
        const { error } = await supabase
          .from("class_schedules")
          .insert(scheduleData);
          
        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        
        toast({
          title: "Schedule created",
          description: "The class schedule has been successfully created.",
        });
      }

      onSuccess();
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
