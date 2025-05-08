
import { ClassScheduleFormValues } from "../../schemas/classScheduleFormSchema";
import { ScheduleData } from "./types";
import { prepareDateTime } from "./dateUtils";

export function prepareScheduleData(data: ClassScheduleFormValues, classId: string): ScheduleData {
  // Check if we have selected dates
  if (!data.selectedDates || data.selectedDates.length === 0) {
    throw new Error("Please select at least one date");
  }
  
  // Sort dates to find first and last
  const sortedDates = [...data.selectedDates].sort((a, b) => a.getTime() - b.getTime());
  const firstDate = sortedDates[0];
  
  // Set hours and minutes from time strings
  const startDateTime = prepareDateTime([firstDate], data.startTime);
  const endDateTime = prepareDateTime([firstDate], data.endTime);
  
  // If end time is earlier than start time, assume it's for the next day
  if (endDateTime < startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }
  
  // Use the No Trainer ID constant for 'none' trainer selection
  const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';
  
  // Return the base schedule data
  return {
    class_id: classId,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
    recurring: data.isRecurring,
    recurrence_pattern: data.referenceTitle,
    selected_dates: data.selectedDates.map(date => date.toISOString()),
    trainer_id: data.trainerId === 'none' ? NO_TRAINER_ID : data.trainerId,
  };
}
