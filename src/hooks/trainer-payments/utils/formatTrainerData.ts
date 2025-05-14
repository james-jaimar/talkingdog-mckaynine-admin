
import { Schedule, Booking, InvoiceItem, TrainerPaymentData, TrainerClassDetail } from "../types";

export function formatTrainerPaymentData(
  trainer: any,
  schedules: Schedule[],
  bookings: Booking[],
  invoiceItems: InvoiceItem[],
  payments: any[]
): TrainerPaymentData {
  // Initialize variables
  let totalEarned = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let potentialEarnings = 0;
  let clientsCount = 0;
  let lastPaymentDate = null;
  let hasUnpaidCommission = false;
  let hasZeroCommissionClasses = false;
  let hasZeroAmountPayments = false;
  
  const clientIds = new Set<string>();
  const classDetails: TrainerClassDetail[] = [];
  const scheduleIds = schedules.map(s => s.id);
  
  // Process each schedule
  schedules.forEach(schedule => {
    // Skip schedules without class data
    if (!schedule.classes) return;
    
    // Check for zero commission classes
    if (schedule.classes.trainer_fee_value === 0 || 
        schedule.classes.trainer_fee_type === 'percentage' && schedule.classes.trainer_fee_value === 0) {
      hasZeroCommissionClasses = true;
    }
    
    // Get all bookings for this schedule
    const scheduleBookings = bookings.filter(b => b.class_schedule_id === schedule.id);
    
    // Skip if no bookings
    if (!scheduleBookings.length) return;
    
    // Track unique clients
    scheduleBookings.forEach(booking => {
      if (booking.client_id) clientIds.add(booking.client_id);
    });
    
    // Calculate revenue and earnings for this schedule
    let scheduleRevenue = 0;
    let schedulePotentialRevenue = 0;
    const schedulePayments = payments.filter(p => p.class_schedule_id === schedule.id);
    const isPaid = schedulePayments.some(p => p.status === 'paid');
    const hasZeroAmount = schedulePayments.some(p => p.amount === 0);
    
    if (hasZeroAmount) {
      hasZeroAmountPayments = true;
    }
    
    // Get all invoice items for this schedule's bookings
    const bookingIds = scheduleBookings.map(b => b.id);
    const scheduleInvoiceItems = invoiceItems.filter(i => i.booking_id && bookingIds.includes(i.booking_id));
    
    // Calculate total revenue from invoices
    scheduleInvoiceItems.forEach(item => {
      const amount = item.amount || 0;
      
      // Only count as revenue if invoice is paid
      if (item.invoices?.status === 'paid') {
        scheduleRevenue += amount;
      }
      
      // Always calculate potential revenue
      schedulePotentialRevenue += amount;
      
      // Calculate trainer's commission
      const commission = calculateTrainerCommission(
        amount, 
        schedule.classes.trainer_fee_type, 
        schedule.classes.trainer_fee_value
      );
      
      if (item.invoices?.status === 'paid') {
        totalEarned += commission;
      } else {
        hasUnpaidCommission = true;
      }
      
      // Always add to potential earnings
      potentialEarnings += commission;
    });
    
    // Calculate paid and pending amounts
    const paidForSchedule = schedulePayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    totalPaid += paidForSchedule;
    
    // Pending is the potential earnings minus what's been paid
    const pendingForSchedule = schedulePotentialRevenue - paidForSchedule;
    totalPending += pendingForSchedule;
    
    // Get latest payment date
    const schedulePaymentDates = schedulePayments
      .filter(p => p.status === 'paid' && p.payment_date)
      .map(p => new Date(p.payment_date).getTime());
      
    if (schedulePaymentDates.length) {
      const maxDate = new Date(Math.max(...schedulePaymentDates));
      if (!lastPaymentDate || new Date(lastPaymentDate) < maxDate) {
        lastPaymentDate = maxDate.toISOString();
      }
    }
    
    // Create booking details for class
    const bookingDetails = scheduleBookings.map(booking => {
      const bookingItems = scheduleInvoiceItems.filter(i => i.booking_id === booking.id);
      const itemsAmount = bookingItems.reduce((sum, i) => sum + (i.amount || 0), 0);
      const commission = calculateTrainerCommission(
        itemsAmount,
        schedule.classes.trainer_fee_type,
        schedule.classes.trainer_fee_value
      );
      
      return {
        bookingId: booking.id,
        clientId: booking.client_id || '',
        handlerName: booking.client?.first_name && booking.client?.last_name ? 
          `${booking.client.first_name} ${booking.client.last_name}` : 
          (booking.clients?.first_name && booking.clients?.last_name ? 
            `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown'),
        commissionAmount: commission
      };
    });
    
    // Add to class details
    classDetails.push({
      scheduleId: schedule.id,
      className: schedule.classes.name,
      classDate: schedule.start_time,
      scheduleDate: new Date(schedule.start_time),
      revenue: scheduleRevenue,
      potentialRevenue: schedulePotentialRevenue,
      bookings: scheduleBookings.length,
      isPaid,
      hasZeroAmountPayment: hasZeroAmount,
      hasZeroCommission: schedule.classes.trainer_fee_value === 0,
      branchId: schedule.classes.branch_id,
      bookingsDetails: bookingDetails
    });
  });
  
  // Sort class details by date
  classDetails.sort((a, b) => a.scheduleDate.getTime() - b.scheduleDate.getTime());
  
  // Create and return trainer payment data
  return {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name}`,
    trainerEmail: trainer.email,
    totalEarned,
    paid: totalPaid,
    pending: totalPending,
    potentialEarnings,
    classesCount: schedules.length,
    clients: clientIds.size,
    lastPaymentDate,
    scheduleIds,
    hasUnpaidCommission,
    hasZeroCommissionClasses,
    hasZeroAmountPayments,
    classDetails,
  };
}

// Helper function to calculate trainer commission
function calculateTrainerCommission(
  amount: number,
  feeType: string,
  feeValue: number
): number {
  if (feeType === 'percentage') {
    return amount * (feeValue / 100);
  } else if (feeType === 'fixed') {
    return feeValue;
  }
  return 0;
}
