
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ClassSchedule } from "../types/classSchedule";
import { classScheduleFormSchema, ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";
import { useTrainerOptions } from "./useTrainerOptions";
import { useScheduleSubmit } from "./useScheduleSubmit";
import { useClassScheduleDateUtils } from "./useClassScheduleDateUtils";
import { useTerm } from "@/context/TermContext";

export function useClassScheduleForm(
  classId: string, 
  schedule: ClassSchedule | null, 
  onSuccess: () => void
) {
  const { formatTimeFromDate } = useClassScheduleDateUtils();
  const { trainers, isLoadingTrainers } = useTrainerOptions();
  const { termData } = useTerm();
  const { isSubmitting, onSubmit } = useScheduleSubmit({ 
    classId, 
    schedule, 
    onSuccess, 
  });
  
  let defaultValues: ClassScheduleFormValues;
  
  if (schedule) {
    const startDate = new Date(schedule.start_time);
    const endDate = new Date(schedule.end_time);
    
    const selectedDates = schedule.selected_dates 
      ? schedule.selected_dates.map(dateStr => new Date(dateStr))
      : [];
    
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
      termId: schedule.term_id || termData?.id || "",
    };
  } else {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    
    const endTime = new Date(nextHour);
    endTime.setHours(endTime.getHours() + 1);
    
    defaultValues = {
      trainerId: "",
      startTime: format(nextHour, "HH:mm"),
      endTime: format(endTime, "HH:mm"),
      isRecurring: false,
      referenceTitle: "Class " + format(nextHour, "MMMM/yyyy"),
      selectedDates: [],
      termId: termData?.id || "",
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
