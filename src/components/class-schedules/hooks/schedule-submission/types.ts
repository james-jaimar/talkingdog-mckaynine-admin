
import { ClassScheduleFormValues } from "../../schemas/classScheduleFormSchema";

export interface UseScheduleSubmitProps {
  classId: string;
  schedule: ClassSchedule | null;
  onSuccess: () => void;
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  trainer_id: string;
  term_id: string | null;
  start_time: string;
  end_time: string;
  recurring: boolean;
  recurrence_pattern: string | null;
  selected_dates: string[];
  created_at: string;
  updated_at: string;
  class?: {
    name: string;
  };
}

export interface ScheduleData {
  class_id: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  recurrence_pattern: string | null;
  selected_dates: string[];
  trainer_id: string;
  term_id: string;
}

export interface Term {
  id: string;
  start_date: string | Date;
  end_date: string | Date;
}
