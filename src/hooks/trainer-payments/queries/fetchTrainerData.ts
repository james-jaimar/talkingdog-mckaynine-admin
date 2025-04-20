
import { supabase } from "@/integrations/supabase/client";

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

export async function fetchSchedules(trainerId: string) {
  const { data: schedules, error } = await supabase
    .from('class_schedules')
    .select(`
      id,
      start_time,
      end_time,
      classes:class_id (
        id,
        name,
        trainer_fee_type,
        trainer_fee_value
      )
    `)
    .eq('trainer_id', trainerId);

  if (error) {
    console.error(`Error fetching schedules for trainer ${trainerId}:`, error);
    throw error;
  }

  return schedules;
}

export async function fetchBookings(scheduleIds: string[], dateRange?: { from: string; to: string }) {
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

  return bookings;
}

export async function fetchInvoiceItems(bookingIds: string[]) {
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

  return invoiceItems;
}
