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

// Update Booking type to make optional fields that might not be returned from some queries
export type Booking = {
  id: string;
  client_id?: string;   // Making optional
  dog_id?: string;      // Making optional
  class_schedule_id: string;
  payment_status: string;
  // Other fields from the database table
  created_at?: string;
  updated_at?: string;
  is_enrolled?: boolean;
  vaccination_verified?: boolean;
  status?: string;
  notes?: string;
  proof_of_payment?: string;
  additional_notes?: string;
  info_eo?: string;
  info_pg?: string;
  // Add a computed field for clients information that may come from a join
  clients?: {
    uses_whatsapp_status?: string;
    social_media_consent_status?: string;
    first_name?: string;
    last_name?: string;
  };
  // Add a computed field for info statuses
  info_eo_status?: boolean | null;
  info_pg_status?: boolean | null;
};

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
