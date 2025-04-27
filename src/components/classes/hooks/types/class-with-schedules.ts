
import { Class } from "../../types/class";
import { ClassSchedule } from "../../types/class-schedule";

export interface ClassWithSchedules extends Class {
  // Using a specific type that matches what we actually get from the database
  class_schedules?: {
    id: string;
    start_time: string;
    end_time: string;
    selected_dates?: string[];
    term_id?: string;
    bookings?: { id: string }[];
  }[];
}
