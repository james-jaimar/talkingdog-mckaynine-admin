
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

  const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';

  const onSubmit = async (data: ClassScheduleFormValues) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      console.log("Starting schedule submission with data:", data);
      console.log("For class ID:", classId);
      
      // Check if we have selected dates
      if (!data.selectedDates || data.selectedDates.length === 0) {
        throw new Error("Please select at least one date");
      }
      
      // Sort dates to find first and last
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

      // Create schedule data object
      const scheduleData: any = {
        class_id: classId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        recurring: data.isRecurring,
        recurrence_pattern: data.referenceTitle,
        selected_dates: data.selectedDates.map(date => date.toISOString()),
        // Use No Trainer ID if 'none' is selected
        trainer_id: data.trainerId === 'none' ? NO_TRAINER_ID : data.trainerId,
      };

      console.log("Prepared schedule data for submission:", scheduleData);

      let result;
      
      if (schedule) {
        // Update existing schedule
        result = await supabase
          .from("class_schedules")
          .update(scheduleData)
          .eq("id", schedule.id);
          
        if (result.error) {
          console.error("Supabase update error:", result.error);
          throw result.error;
        }
        
        console.log("Schedule updated successfully:", result);
        
        toast({
          title: "Schedule updated",
          description: "The class schedule has been successfully updated.",
        });
      } else {
        // Create new schedule
        result = await supabase
          .from("class_schedules")
          .insert(scheduleData);
          
        if (result.error) {
          console.error("Supabase insert error:", result.error);
          throw result.error;
        }
        
        console.log("Schedule created successfully:", result);
        
        toast({
          title: "Schedule created",
          description: "The class schedule has been successfully created.",
        });
      }

      // Wait a moment before triggering success callback
      setTimeout(() => {
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
