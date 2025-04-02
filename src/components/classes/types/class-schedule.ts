
export interface ClassSchedule {
  id: string;
  class_id: string;
  trainer_id: string;
  start_time: string;
  end_time: string;
  recurring: boolean | null;
  recurrence_pattern: string | null;
  selected_dates: string[] | null;
  created_at: string;
  updated_at: string;
  // Additional display fields
  title?: string;
  description?: string;
  start_date?: string;
  time?: string;
  location?: string;
  schedule_id?: string;
  // Additional class data
  classes?: any;
}
