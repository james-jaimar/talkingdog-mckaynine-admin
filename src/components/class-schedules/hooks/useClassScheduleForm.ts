
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
    return setMinutes(setHours(date, hours), minutes);
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
      selectedDates: selectedDates,
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
      selectedDates: [],
    };
  }
  
  const form = useForm<ClassScheduleFormValues>({
    resolver: zodResolver(classScheduleFormSchema),
    defaultValues,
  });
  
  // Watch for changes to the startDate to update endDate if they're the same
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  
  useEffect(() => {
    if (startDate && endDate && !schedule) {
      // Only sync dates automatically for new schedules
      form.setValue("endDate", startDate);
    }
  }, [startDate, form, schedule, endDate]);
  
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
    
    try {
      // Combine date and time into ISO strings
      const startDateTime = combineDateTime(values.startDate, values.startTime);
      const endDateTime = combineDateTime(values.endDate, values.endTime);
      
      // Validate end time is after start time
      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }
      
      // Convert selected dates to ISO strings if they exist
      const selectedDatesISO = values.selectedDates?.map(date => date.toISOString()) || [];
      
      const scheduleData = {
        class_id: classId,
        trainer_id: values.trainerId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        recurring: values.isRecurring,
        recurrence_pattern: values.referenceTitle,
        selected_dates: selectedDatesISO,
      };
      
      if (schedule) {
        // Update existing schedule
        const { error } = await supabase
          .from("class_schedules")
          .update(scheduleData)
          .eq("id", schedule.id);
        
        if (error) throw error;
        
        toast({
          title: "Schedule updated successfully",
          description: `The schedule has been updated.`,
        });
      } else {
        // Create new schedule
        const { error } = await supabase
          .from("class_schedules")
          .insert(scheduleData);
        
        if (error) throw error;
        
        toast({
          title: "Schedule created successfully",
          description: `The schedule has been added.`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["class-schedules", classId] });
      onSuccess();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Failed to save schedule",
        description: String(error) || "An unexpected error occurred.",
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
