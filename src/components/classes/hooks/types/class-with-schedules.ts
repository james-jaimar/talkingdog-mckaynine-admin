
import { Class } from "../../types/class";

export interface ClassWithSchedules extends Class {
  class_schedules?: {
    id: string;
    start_time: string;
    end_time: string;
    selected_dates?: string[];
    term_id?: string;
    bookings?: { id: string }[];
  }[];
}
