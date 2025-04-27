
import { Class } from "../../types/class";

export interface ClassWithSchedules extends Omit<Class, 'class_schedules'> {
  // Using a specific type that matches what we actually get from the database
  class_schedules?: {
    id: string;
    start_time: string;
    end_time: string;
    selected_dates?: string[];
    term_id?: string;
    bookings?: { id: string }[];
  }[];
  
  // Visual indicator for UI - will be set by components as needed
  isMoving?: boolean;
}
