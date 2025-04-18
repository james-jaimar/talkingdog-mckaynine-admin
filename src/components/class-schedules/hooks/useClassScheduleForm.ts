
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ClassSchedule } from "../types/classSchedule";
import { classScheduleFormSchema, ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useTrainerOptions } from "./useTrainerOptions";
import { useScheduleSubmit } from "./useScheduleSubmit";
import { useClassScheduleDateUtils } from "./useClassScheduleDateUtils";

export function useClassScheduleForm(
  classId: string, 
  schedule: ClassSchedule | null, 
  onSuccess: () => void
) {
  const { formatTimeFromDate } = useClassScheduleDateUtils();
  const { trainers, isLoadingTrainers } = useTrainerOptions();
  const { isSubmitting, onSubmit } = useScheduleSubmit({ classId, schedule, onSuccess });
  
  // Parse existing schedule data if editing
  let defaultValues: ClassScheduleFormValues;
  
  if (schedule) {
    const startDate = new Date(schedule.start_time);
    const endDate = new Date(schedule.end_time);
    
    // Convert stored string dates to Date objects if they exist
    const selectedDates = schedule.selected_dates 
      ? schedule.selected_dates.map(dateStr => new Date(dateStr))
      : [];
    
    // Fix: Handle trainer ID more carefully to avoid potential undefined issues
    const trainerIdValue = schedule.trainer_id 
      ? (schedule.trainer_id === 'ba95153f-699c-4cc1-afe5-762bf30033d4' ? 'none' : schedule.trainer_id)
      : 'none';
    
    defaultValues = {
      trainerId: trainerIdValue,
      startTime: format(startDate, "HH:mm"),
      endTime: format(endDate, "HH:mm"),
      isRecurring: schedule.recurring || false,
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
      startTime: format(nextHour, "HH:mm"),
      endTime: format(endTime, "HH:mm"),
      isRecurring: false,
      referenceTitle: "Class " + format(nextHour, "MMMM/yyyy"),
      selectedDates: [nextHour],
    };
  }
  
  const form = useForm<ClassScheduleFormValues>({
    resolver: zodResolver(classScheduleFormSchema),
    defaultValues,
  });
  
  return {
    form,
    isSubmitting,
    trainers,
    isLoadingTrainers,
    onSubmit
  };
}
