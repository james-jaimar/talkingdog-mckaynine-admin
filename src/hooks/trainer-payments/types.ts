
import { Database } from "@/integrations/supabase/types";

export interface TrainerClassDetail {
  scheduleId: string;
  className: string;
  classDate: string;
  revenue: number;
  bookings: number;
  isPaid: boolean;
  scheduleDate: Date;
}

export interface TrainerPaymentData {
  id: string;
  trainerName: string;
  totalEarned: number;
  paid: number;
  pending: number;
  classesCount: number;
  clients: number;
  lastPaymentDate?: string;
  scheduleIds: string[];
  classDetails?: TrainerClassDetail[];
  expanded?: boolean;
}

// Update the Schedule type to match the actual data structure from fetchSchedules
export interface Schedule {
  id: string;
  class_id?: string;
  trainer_id?: string;
  start_time: string;
  end_time: string;
  recurring?: boolean;
  recurrence_pattern?: string | null;
  selected_dates?: string[] | null;
  created_at?: string;
  updated_at?: string;
  classes?: {
    id: string;
    name: string;
    trainer_fee_type: string;
    trainer_fee_value: number;
  } | null;
}

export type Booking = Database['public']['Tables']['bookings']['Row'];

export type InvoiceItem = {
  id: string;
  amount: number;
  booking_id: string;
  invoices: {
    id: string;
    status: string;
    payment_date?: string;
  } | null;
};
