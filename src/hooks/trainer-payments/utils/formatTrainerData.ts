
import { 
  Schedule, 
  Booking, 
  InvoiceItem,
  TrainerPaymentData,
  TrainerClassDetail,
  BookingDetail
} from "../types";

export function formatTrainerPaymentData(
  trainer: any,
  schedules: Schedule[],
  bookings: Booking[],
  invoiceItems: InvoiceItem[],
  payments: any[]
): TrainerPaymentData {
  // Initialize base trainer data
  const result: TrainerPaymentData = {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name}`,
    trainerEmail: trainer.email,
    totalEarned: 0,
    paid: 0,
    pending: 0,
    potentialEarnings: 0,
    classesCount: schedules.length,
    clients: 0,
    classDetails: [],
    hasUnpaidCommission: false,
    hasZeroCommissionClasses: false
  };

  // Set of unique client IDs to count unique clients
  const uniqueClientIds = new Set<string>();
  
  // Track the last payment date
  let lastPaymentDate: Date | null = null;
  
  // Process each schedule
  schedules.forEach(schedule => {
    const className = schedule.classes?.name || 'Unknown class';
    const scheduleDate = new Date(schedule.start_time);
    const formattedDate = scheduleDate.toLocaleDateString();
    
    // Get bookings for this schedule
    const scheduleBookings = bookings.filter(b => b.class_schedule_id === schedule.id);
    
    // Count unique clients from bookings
    scheduleBookings.forEach(booking => {
      if (booking.client_id) {
        uniqueClientIds.add(booking.client_id);
      } else if (booking.clients?.id) {
        uniqueClientIds.add(booking.clients.id);
      }
    });
    
    // Calculate revenue for this class
    let schedulePotentialRevenue = 0;
    let scheduleActualRevenue = 0;
    
    // Get details for all bookings in this schedule
    const bookingsDetails: BookingDetail[] = [];
    
    // Process bookings and invoice items
    scheduleBookings.forEach(booking => {
      // Find invoice items for this booking
      const bookingInvoiceItems = invoiceItems.filter(ii => ii.booking_id === booking.id);
      
      if (bookingInvoiceItems.length > 0) {
        const totalAmount = bookingInvoiceItems.reduce((sum, item) => sum + item.amount, 0);
        schedulePotentialRevenue += totalAmount;
        
        // Check if the invoice is paid
        const isPaid = bookingInvoiceItems.some(ii => 
          ii.invoices && ii.invoices.status === 'paid'
        );
        
        if (isPaid) {
          scheduleActualRevenue += totalAmount;
        }
        
        // Add booking details
        bookingsDetails.push({
          bookingId: booking.id,
          clientId: booking.client_id || booking.clients?.id || '',
          handlerName: `${booking.client?.first_name || booking.clients?.first_name || ''} ${booking.client?.last_name || booking.clients?.last_name || ''}`.trim(),
          commissionAmount: totalAmount
        });
      }
    });
    
    // Get payment records for this schedule
    const schedulePayments = payments.filter(p => p.class_schedule_id === schedule.id);
    const isPaid = schedulePayments.some(p => p.status === 'paid');
    
    // Check if zero commission is intended based on class settings
    const hasZeroCommission = schedule.classes?.trainer_fee_type === 'fixed' && 
                            schedule.classes?.trainer_fee_value === 0;
    
    // Only consider it a zero amount payment issue if it's not supposed to be zero commission
    const hasZeroAmountPayment = schedulePayments.some(p => p.amount === 0) && !hasZeroCommission;
    
    // Track last payment date
    if (isPaid && schedulePayments.length > 0) {
      const paymentDates = schedulePayments
        .filter(p => p.payment_date)
        .map(p => new Date(p.payment_date));
      
      if (paymentDates.length > 0) {
        const maxDate = new Date(Math.max.apply(null, paymentDates.map(d => d.getTime())));
        if (!lastPaymentDate || maxDate > lastPaymentDate) {
          lastPaymentDate = maxDate;
        }
      }
    }
    
    // Add class detail to result
    result.classDetails.push({
      scheduleId: schedule.id,
      className,
      classDate: formattedDate,
      scheduleDate,
      bookings: scheduleBookings.length,
      revenue: scheduleActualRevenue,
      potentialRevenue: schedulePotentialRevenue,
      isPaid,
      hasZeroAmountPayment,
      hasZeroCommission,
      bookingsDetails
    });
    
    // Update totals
    result.potentialEarnings += schedulePotentialRevenue;
    
    if (isPaid) {
      result.totalEarned += scheduleActualRevenue;
      result.paid += scheduleActualRevenue;
    } else {
      result.pending += scheduleActualRevenue;
      if (scheduleActualRevenue > 0) {
        result.hasUnpaidCommission = true;
      }
    }
    
    // Track if there are any zero commission classes
    if (hasZeroCommission) {
      result.hasZeroCommissionClasses = true;
    }
  });
  
  // Set unique clients count
  result.clients = uniqueClientIds.size;
  
  // Set last payment date if any
  if (lastPaymentDate) {
    result.lastPaymentDate = lastPaymentDate.toISOString();
  }
  
  return result;
}
