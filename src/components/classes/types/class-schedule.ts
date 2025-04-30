
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
  trainer?: {
    first_name: string;
    last_name: string;
  };
  term?: {
    term_number: string;
    academic_year: {
      year: number;
    };
  };
  bookings?: {
    id: string;
    client_id?: string;
    dog_id?: string;
  }[];
}

// Add a simplified version for ClassWithSchedules to use
export interface ClassScheduleBasic {
  id: string;
  start_time: string;
  end_time: string;
  term_id?: string;
  selected_dates?: string[];
  bookings?: { 
    id: string;
    client_id?: string;
    dog_id?: string;
  }[];
}
