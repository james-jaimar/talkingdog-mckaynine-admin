
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ClassSchedule } from "../types/classSchedule";
import { classScheduleFormSchema, ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { format, parse, setHours, setMinutes } from "date-fns";

// Trainer option type
type TrainerOption = {
  label: string;
  value: string;
};

export function useClassScheduleForm(
  classId: string, 
  schedule: ClassSchedule | null, 
  onSuccess: () => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Helper to combine date and time
  const combineDateTime = (date: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return setMinutes(setHours(new Date(date), hours), minutes);
  };
  
  // Parse existing schedule data if editing
  let defaultValues: ClassScheduleFormValues;
  
  if (schedule) {
    const startDate = new Date(schedule.start_time);
    const endDate = new Date(schedule.end_time);
    
    // Convert stored string dates to Date objects if they exist
    const selectedDates = schedule.selected_dates 
      ? schedule.selected_dates.map(dateStr => new Date(dateStr))
      : [];
    
    defaultValues = {
      trainerId: schedule.trainer_id,
      startDate: startDate,
      startTime: format(startDate, "HH:mm"),
      endDate: endDate,
      endTime: format(endDate, "HH:mm"),
      isRecurring: schedule.recurring || false,
      recurrencePattern: schedule.recurrence_pattern || "",
      referenceTitle: schedule.recurrence_pattern || "Class " + format(startDate, "MMMM/yyyy"),
      selectedDates: selectedDates.length > 0 ? selectedDates : [startDate],
    };
  } else {
    const now = new Date();
    // Set default to next hour
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    
    // End time 1 hour after start
    const endTime = new Date(nextHour);
    endTime.setHours(endTime.getHours() + 1);
    
    defaultValues = {
      trainerId: "",
      startDate: nextHour,
      startTime: format(nextHour, "HH:mm"),
      endDate: nextHour,
      endTime: format(endTime, "HH:mm"),
      isRecurring: false,
      recurrencePattern: "",
      referenceTitle: "Class " + format(nextHour, "MMMM/yyyy"),
      selectedDates: [nextHour],
    };
  }
  
  const form = useForm<ClassScheduleFormValues>({
    resolver: zodResolver(classScheduleFormSchema),
    defaultValues,
  });
  
  // Fetch trainers for dropdown
  useEffect(() => {
    const fetchTrainers = async () => {
      setIsLoadingTrainers(true);
      try {
        const { data, error } = await supabase
          .from("trainers")
          .select("id, first_name, last_name")
          .order("last_name, first_name");
        
        if (error) {
          throw error;
        }
        
        if (data && Array.isArray(data)) {
          const trainerOptions = data.map(trainer => ({
            value: trainer.id,
            label: `${trainer.first_name} ${trainer.last_name}`
          }));
          
          setTrainers(trainerOptions);
        } else {
          setTrainers([]);
        }
      } catch (error) {
        console.error("Error fetching trainers:", error);
        toast({
          title: "Failed to load trainers",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
        setTrainers([]);
      } finally {
        setIsLoadingTrainers(false);
      }
    };
    
    fetchTrainers();
  }, [toast]);
  
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
        trainer_id: values.trainerId,
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
    form,
    isSubmitting,
    trainers,
    isLoadingTrainers,
    onSubmit
  };
}
