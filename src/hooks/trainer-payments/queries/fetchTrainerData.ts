import { supabase } from "@/integrations/supabase/client";
import { Schedule, Booking, InvoiceItem } from "../types";

export async function fetchTrainers(branchId: string) {
  const { data: trainers, error } = await supabase
    .from('trainers')
    .select(`
      id,
      first_name,
      last_name
    `)
    .eq('branch_id', branchId);

  if (error) {
    console.error('Error fetching trainers:', error);
    throw error;
  }

  return trainers;
}

export async function fetchSchedules(trainerId: string): Promise<Schedule[]> {
  const { data: schedules, error } = await supabase
    .from('class_schedules')
    .select(`
      id,
      class_id,
      trainer_id,
      start_time,
      end_time,
      recurring,
      recurrence_pattern,
      selected_dates,
      created_at,
      updated_at,
      classes:class_id (
        id,
        name,
        trainer_fee_type,
        trainer_fee_value,
        mckaynine_commission_type,
        mckaynine_commission_value,
        admin_fee_type,
        admin_fee_value,
        course_fee,
        enrollment_fee
      )
    `)
    .eq('trainer_id', trainerId);

  if (error) {
    console.error(`Error fetching schedules for trainer ${trainerId}:`, error);
    throw error;
  }

  return schedules as Schedule[];
}

export async function fetchBookings(scheduleIds: string[], dateRange?: { from: string; to: string }): Promise<Booking[]> {
  if (scheduleIds.length === 0) return [];

  const query = supabase
    .from('bookings')
    .select(`
      id,
      client_id,
      class_schedule_id,
      payment_status
    `)
    .in('class_schedule_id', scheduleIds);

  if (dateRange) {
    query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return bookings as Booking[];
}

export async function fetchInvoiceItems(bookingIds: string[]): Promise<InvoiceItem[]> {
  if (bookingIds.length === 0) return [];

  const { data: invoiceItems, error } = await supabase
    .from('invoice_items')
    .select(`
      id,
      amount,
      booking_id,
      invoice_id,
      invoices:invoice_id (
        id,
        status,
        payment_date
      )
    `)
    .in('booking_id', bookingIds);

  if (error) {
    console.error('Error fetching invoice items:', error);
    throw error;
  }

  return invoiceItems as InvoiceItem[];
}

export async function fetchTrainerPayments(trainerId: string, dateRange?: { from: string; to: string }) {
  const query = supabase
    .from('trainer_payments')
    .select(`
      id,
      amount,
      status,
      payment_date,
      class_schedule_id
    `)
    .eq('trainer_id', trainerId);

  if (dateRange) {
    query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
  }

  const { data: payments, error } = await query;

  if (error) {
    console.error('Error fetching trainer payments:', error);
    throw error;
  }

  return payments;
}
