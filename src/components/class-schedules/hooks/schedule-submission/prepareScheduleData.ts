
import { ClassScheduleFormValues } from "../../schemas/classScheduleFormSchema";
import { ScheduleData } from "./types";
import { prepareDateTime } from "./dateUtils";

const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';

export async function prepareScheduleData(
  data: ClassScheduleFormValues,
  classId: string
): Promise<ScheduleData> {
  if (!data.selectedDates || data.selectedDates.length === 0) {
    throw new Error("Please select at least one date");
  }

  const sortedDates = [...data.selectedDates].sort((a, b) => a.getTime() - b.getTime());
  const firstDate = sortedDates[0];

  const startDateTime = prepareDateTime([firstDate], data.startTime);
  const endDateTime = prepareDateTime([firstDate], data.endTime);

  if (endDateTime < startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return {
    class_id: classId,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
    recurring: data.isRecurring,
    recurrence_pattern: data.referenceTitle,
    selected_dates: data.selectedDates.map(date => date.toISOString()),
    trainer_id: data.trainerId === 'none' ? NO_TRAINER_ID : data.trainerId,
    term_id: data.termId,
  };
}
