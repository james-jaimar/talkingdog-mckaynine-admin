
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

export type Schedule = Database['public']['Tables']['class_schedules']['Row'] & {
  classes: Database['public']['Tables']['classes']['Row'] | null;
};

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
