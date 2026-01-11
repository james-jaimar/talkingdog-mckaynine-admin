
import { supabase } from "@/integrations/supabase/client";
import { Schedule, Booking, InvoiceItem } from "../types";

export async function fetchTrainers(branchId: string) {
  const { data: trainers, error } = await supabase
    .from('trainers')
    .select(`
      id,
      first_name,
      last_name,
      email
    `)
    .eq('branch_id', branchId);

  if (error) {
    console.error('Error fetching trainers:', error);
    throw error;
  }

  return trainers;
}

// Batched version: Fetch all schedules for multiple trainers at once
export async function fetchAllSchedulesForTrainers(trainerIds: string[], termId?: string): Promise<Schedule[]> {
  if (trainerIds.length === 0) return [];
  
  let query = supabase
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
      term_id,
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
        enrollment_fee,
        branch_id
      )
    `)
    .in('trainer_id', trainerIds);

  if (termId) {
    query = query.eq('term_id', termId);
  }

  const { data: schedules, error } = await query;

  if (error) {
    console.error('Error fetching schedules for trainers:', error);
    throw error;
  }

  return schedules as Schedule[];
}

// Batched version: Fetch all bookings for all schedules at once
export async function fetchAllBookings(scheduleIds: string[], branchId?: string): Promise<Booking[]> {
  if (scheduleIds.length === 0) return [];

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      client_id,
      class_schedule_id,
      payment_status,
      status,
      is_enrolled,
      clients:client_id (
        id,
        first_name, 
        last_name,
        branch_id
      )
    `)
    .in('class_schedule_id', scheduleIds);

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  // Filter by branch and add client property for compatibility
  const bookingsWithClientData = bookings
    .filter(booking => !branchId || booking.clients?.branch_id === branchId)
    .map(booking => ({
      ...booking,
      client: booking.clients,
    })) as unknown as Booking[];

  return bookingsWithClientData;
}

// Batched version: Fetch all invoice items for all bookings at once
export async function fetchAllInvoiceItems(bookingIds: string[], branchId?: string): Promise<InvoiceItem[]> {
  if (bookingIds.length === 0) return [];

  const { data: invoiceItems, error } = await supabase
    .from('invoice_items')
    .select(`
      id,
      amount,
      booking_id,
      invoice_id,
      description,
      quantity,
      unit_price,
      item_type,
      invoices:invoice_id (
        id,
        status,
        payment_date,
        client_id,
        client:client_id (
          branch_id
        )
      )
    `)
    .in('booking_id', bookingIds);

  if (error) {
    console.error('Error fetching invoice items:', error);
    throw error;
  }

  // Filter by branch_id if specified
  const filteredItems = branchId 
    ? invoiceItems.filter(item => item.invoices?.client?.branch_id === branchId)
    : invoiceItems;

  const completeInvoiceItems = filteredItems.map(item => ({
    id: item.id,
    invoice_id: item.invoice_id,
    booking_id: item.booking_id,
    description: item.description || 'Class booking',
    quantity: item.quantity || 1,
    unit_price: item.unit_price || item.amount || 0,
    amount: item.amount || 0,
    item_type: item.item_type,
    invoices: item.invoices,
    branch_id: item.invoices?.client?.branch_id
  })) as InvoiceItem[];

  return completeInvoiceItems;
}

// Batched version: Fetch all trainer payments for multiple trainers at once
export async function fetchAllTrainerPayments(trainerIds: string[], scheduleIds?: string[]) {
  if (trainerIds.length === 0) return [];
  
  let query = supabase
    .from('trainer_payments')
    .select(`
      id,
      amount,
      status,
      payment_date,
      class_schedule_id,
      trainer_id
    `)
    .in('trainer_id', trainerIds);

  if (scheduleIds && scheduleIds.length > 0) {
    query = query.in('class_schedule_id', scheduleIds);
  }

  const { data: payments, error } = await query;

  if (error) {
    console.error('Error fetching trainer payments:', error);
    throw error;
  }

  return payments;
}

// Legacy functions kept for backward compatibility with single trainer queries
export async function fetchSchedules(trainerId: string, termId?: string): Promise<Schedule[]> {
  return fetchAllSchedulesForTrainers([trainerId], termId);
}

export async function fetchBookings(scheduleIds: string[], branchId?: string): Promise<Booking[]> {
  return fetchAllBookings(scheduleIds, branchId);
}

export async function fetchInvoiceItems(bookingIds: string[], branchId?: string): Promise<InvoiceItem[]> {
  return fetchAllInvoiceItems(bookingIds, branchId);
}

export async function fetchTrainerPayments(trainerId: string, scheduleIds?: string[]) {
  return fetchAllTrainerPayments([trainerId], scheduleIds);
}

// New function to check if payment-documents bucket exists and create it if not
export async function ensurePaymentDocumentsBucketExists() {
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('payment-documents');
    
    if (bucketError && bucketError.message.includes('does not exist')) {
      console.log('Creating payment-documents bucket...');
      const { data, error } = await supabase.storage.createBucket('payment-documents', {
        public: false,
        fileSizeLimit: 10485760,
      });
      
      if (error) {
        console.error('Error creating payment-documents bucket:', error);
      } else {
        console.log('payment-documents bucket created successfully');
      }
    } else if (bucketData) {
      console.log('payment-documents bucket already exists');
    }
  } catch (error) {
    console.error('Error checking/creating payment-documents bucket:', error);
  }
}
