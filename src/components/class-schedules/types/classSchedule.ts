
export interface ClassSchedule {
  id: string;
  class_id: string;
  trainer_id: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  recurrence_pattern: string | null;
  created_at: string;
  updated_at: string;
  trainer?: {
    first_name: string;
    last_name: string;
  };
  class?: {
    name: string;
  };
}
