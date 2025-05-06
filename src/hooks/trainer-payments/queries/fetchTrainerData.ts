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

export async function fetchSchedules(trainerId: string, termId?: string): Promise<Schedule[]> {
  // Build the query with trainer filtering
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
        enrollment_fee
      )
    `)
    .eq('trainer_id', trainerId);

  // Add term filtering if a term ID is provided
  if (termId) {
    query = query.eq('term_id', termId);
    console.log(`Filtering schedules for term: ${termId}`);
  } else {
    console.log("No term ID provided for schedule filtering");
  }

  const { data: schedules, error } = await query;

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
      payment_status,
      status,
      is_enrolled,
      clients:client_id (
        id,
        first_name, 
        last_name
      )
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

  // Add client property for compatibility
  const bookingsWithClientData = bookings.map(booking => ({
    ...booking,
    client: booking.clients, // Make sure both client and clients are available
  })) as unknown as Booking[];

  return bookingsWithClientData;
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
      description,
      quantity,
      unit_price,
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

  // Ensure all required fields are present for the InvoiceItem interface
  const completeInvoiceItems = invoiceItems.map(item => ({
    id: item.id,
    invoice_id: item.invoice_id,
    booking_id: item.booking_id,
    description: item.description || 'Class booking',
    quantity: item.quantity || 1,
    unit_price: item.unit_price || item.amount || 0,
    amount: item.amount || 0,
    invoices: item.invoices
  })) as InvoiceItem[];

  return completeInvoiceItems;
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

// New function to check if payment-documents bucket exists and create it if not
export async function ensurePaymentDocumentsBucketExists() {
  try {
    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('payment-documents');
    
    if (bucketError && bucketError.message.includes('does not exist')) {
      console.log('Creating payment-documents bucket...');
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('payment-documents', {
        public: false,
        fileSizeLimit: 10485760, // 10MB limit for PDF files
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
