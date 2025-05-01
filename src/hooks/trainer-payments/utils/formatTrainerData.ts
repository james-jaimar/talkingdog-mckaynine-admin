
import { Schedule, Booking, InvoiceItem, TrainerPaymentData, TrainerClassDetail } from "../types";
import { supabase } from "@/integrations/supabase/client";

// Format trainer payment data, including client names where available
export async function formatTrainerPaymentData(
  trainer: any,
  schedules: Schedule[],
  bookings: Booking[],
  invoiceItems: InvoiceItem[],
  payments: any[] = []
): Promise<TrainerPaymentData> {
  // Extract client IDs from bookings to fetch their names
  const clientIds = new Set<string>();
  bookings.forEach(booking => {
    if (booking.client_id) {
      clientIds.add(booking.client_id);
    }
  });

  // Fetch client names for the client IDs in bookings
  const clientNamesMap = new Map<string, string>();
  if (clientIds.size > 0) {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .in('id', Array.from(clientIds));
      
    if (!error && clients) {
      clients.forEach(client => {
        const fullName = `${client.first_name} ${client.last_name || ''}`.trim();
        clientNamesMap.set(client.id, fullName);
      });
    }
  }

  // Calculate potential earnings
  let potentialEarnings = 0;
  let actualEarnings = 0;
  let paidAmount = 0;
  const uniqueScheduleIds = new Set<string>();
  
  // Check if there are any recorded trainer payments in the database
  const hasRecordedPayments = payments && payments.length > 0;
  const hasPaidPayments = payments && payments.some(p => p.status === 'paid');
  
  const classDetails: TrainerClassDetail[] = schedules.map(schedule => {
    uniqueScheduleIds.add(schedule.id);
    
    // Find bookings for this schedule
    const scheduleBookings = bookings.filter(b => b.class_schedule_id === schedule.id);
    const bookingsCount = scheduleBookings.length;
    
    // Find invoice items for these bookings
    const bookingIds = scheduleBookings.map(b => b.id);
    const relevantInvoiceItems = invoiceItems.filter(item => 
      item.booking_id && bookingIds.includes(item.booking_id)
    );
    
    // Calculate revenue based on invoice items
    let revenue = 0;
    let potentialRevenue = 0;
    let isPaid = false;
    let hasActualPayment = false;
    
    // Check if there is a recorded payment for this schedule
    if (hasRecordedPayments) {
      const schedulePayment = payments.find(p => p.class_schedule_id === schedule.id);
      isPaid = schedulePayment && schedulePayment.status === 'paid';
      hasActualPayment = !!schedulePayment;
    }
    
    // Create detailed booking information including client names
    const bookingsDetails = scheduleBookings.map(booking => {
      const bookingItems = relevantInvoiceItems.filter(item => item.booking_id === booking.id);
      const bookingRevenue = bookingItems.reduce((sum, item) => sum + item.amount, 0);
      
      // Calculate trainer's commission for this booking
      let commissionAmount = 0;
      if (schedule.classes) {
        if (schedule.classes.trainer_fee_type === 'percentage') {
          commissionAmount = bookingRevenue * (schedule.classes.trainer_fee_value / 100);
        } else {
          commissionAmount = schedule.classes.trainer_fee_value;
        }
      }
      
      // Get client name from map or use fallback
      const clientName = booking.client_id ? clientNamesMap.get(booking.client_id) : undefined;
      
      return {
        bookingId: booking.id,
        handlerName: booking.clients?.first_name 
          ? `${booking.clients.first_name} ${booking.clients.last_name || ''}`.trim()
          : clientName || 'Unnamed Client',
        clientId: booking.client_id || '',
        clientName: clientName || undefined,
        commissionAmount
      };
    });
    
    // Calculate totals from invoice items
    relevantInvoiceItems.forEach(item => {
      const itemAmount = item.amount || 0;
      
      // Add to potential revenue
      potentialRevenue += itemAmount;
      
      // Only count as actual revenue if the invoice is paid
      if (item.invoices?.status === 'paid') {
        revenue += itemAmount;
      }
    });
    
    // Calculate trainer's commission for this class
    let classCommission = 0;
    if (schedule.classes) {
      if (schedule.classes.trainer_fee_type === 'percentage') {
        classCommission = potentialRevenue * (schedule.classes.trainer_fee_value / 100);
      } else if (bookingsCount > 0) {
        classCommission = schedule.classes.trainer_fee_value * bookingsCount;
      }
    }
    
    // Add to total potential earnings
    potentialEarnings += classCommission;
    
    // For paid invoices, add to actual earnings
    // Note: We're no longer using isPaid to determine if we add to actualEarnings
    // This was causing incorrect earnings calculations
    if (revenue > 0) {
      actualEarnings += classCommission * (revenue / potentialRevenue);
    }
    
    // Create schedule date for sorting
    const scheduleDate = new Date(schedule.start_time);
    
    return {
      scheduleId: schedule.id,
      className: schedule.classes?.name || 'Unknown Class',
      classDate: schedule.start_time,
      revenue,
      potentialRevenue,
      bookings: bookingsCount,
      isPaid, // Now only true if explicitly marked as paid in trainer_payments table
      hasActualPayment,
      scheduleDate,
      bookingsDetails
    };
  });
  
  // Sort class details by date (most recent first)
  classDetails.sort((a, b) => b.scheduleDate.getTime() - a.scheduleDate.getTime());
  
  // If we have recorded payments, use those instead of calculated values
  if (hasRecordedPayments) {
    paidAmount = payments.reduce((sum, payment) => {
      return payment.status === 'paid' ? sum + payment.amount : sum;
    }, 0);
  }
  
  // Get last payment date
  let lastPaymentDate;
  if (hasPaidPayments) {
    const paidPayments = payments.filter(p => p.status === 'paid' && p.payment_date);
    if (paidPayments.length > 0) {
      lastPaymentDate = new Date(
        Math.max(...paidPayments.map(p => new Date(p.payment_date).getTime()))
      ).toISOString();
    }
  }
  
  // Count unique clients
  const uniqueClients = new Set<string>();
  bookings.forEach(booking => {
    if (booking.client_id) uniqueClients.add(booking.client_id);
  });
  
  return {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name || ''}`.trim(),
    totalEarned: actualEarnings,
    paid: paidAmount,
    pending: Math.max(0, actualEarnings - paidAmount),
    potentialEarnings,
    classesCount: schedules.length,
    clients: uniqueClients.size,
    lastPaymentDate,
    scheduleIds: Array.from(uniqueScheduleIds),
    classDetails,
    hasReceivedPayment: hasPaidPayments
  };
}
