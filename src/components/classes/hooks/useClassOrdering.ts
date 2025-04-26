
export interface ClassWithSchedules {
  id: string;
  name: string;
  branches: { name: string };
  class_type?: string;
  course_fee?: number;
  enrollment_fee?: number;
  mckaynine_commission_type?: 'percentage' | 'amount';
  mckaynine_commission_value?: number;
  admin_fee_type?: 'percentage' | 'amount';
  admin_fee_value?: number;
  trainer_fee_type?: 'percentage' | 'amount';
  trainer_fee_value?: number;
  duration?: number;
  capacity?: number;
  class_schedules: {
    id: string;
    start_time?: string;
    end_time?: string;
    selected_dates?: string[];
    term_id?: string;
    bookings?: {
      id: string;
    }[];
  }[];
}
