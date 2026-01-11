
import { TrainerPaymentData, TrainerClassDetail, Schedule, Booking, InvoiceItem } from "../types";
import { calculateClassRevenue } from "./calculateTrainerFees";

export function formatTrainerPaymentData(
  trainer: { id: string; first_name: string; last_name: string; email?: string },
  allSchedules: Schedule[],
  bookings: Booking[] = [],
  invoiceItems: InvoiceItem[] = [],
  trainerPayments: any[] = []
): TrainerPaymentData {
  // Validate that we're dealing with a single branch's data
  const scheduleBranchIds = new Set(allSchedules.map(s => s.classes?.branch_id).filter(Boolean));
  const clientBranchIds = new Set(bookings.map(b => b.client?.branch_id || b.clients?.branch_id).filter(Boolean));
  const invoiceBranchIds = new Set(invoiceItems.map(i => i.invoices?.client?.branch_id).filter(Boolean));
  
  if (scheduleBranchIds.size > 1) {
    console.warn(`Warning: Multiple branch IDs found in schedules for trainer ${trainer.first_name} ${trainer.last_name}: `, 
                 Array.from(scheduleBranchIds));
  }
  
  if (clientBranchIds.size > 1) {
    console.warn(`Warning: Multiple branch IDs found in bookings for trainer ${trainer.first_name} ${trainer.last_name}: `, 
                 Array.from(clientBranchIds));
  }
  
  if (invoiceBranchIds.size > 1) {
    console.warn(`Warning: Multiple branch IDs found in invoice items for trainer ${trainer.first_name} ${trainer.last_name}: `, 
                 Array.from(invoiceBranchIds));
  }
  
  const allScheduleIds = allSchedules.map(s => s.id);
  const uniqueClientIds = new Set(bookings?.map(b => b.client_id).filter(Boolean));

  // Track schedules with payment status
  const schedulePaymentStatus = new Map<string, boolean>();
  
  // First, populate the map with payment status from trainer_payments
  trainerPayments.forEach(payment => {
    if (payment.class_schedule_id) {
      schedulePaymentStatus.set(
        payment.class_schedule_id, 
        payment.status === 'paid'
      );
    }
  });

  // Calculate totals from actual payments - these are the source of truth
  const totalPaid = trainerPayments
    .filter(payment => payment.status === 'paid' && payment.amount > 0)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Calculate pending amount from pending payments, filtering out zero-amount payments
  const totalPending = trainerPayments
    .filter(payment => payment.status === 'pending' && payment.amount > 0)
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
  // Determine if there are any actual payments in the system
  const hasActualPayments = trainerPayments && trainerPayments.length > 0;

  // Find last payment date from actual payments
  let lastPaymentDate: string | undefined;
  const paidPayments = trainerPayments.filter(payment => payment.status === 'paid');
  if (paidPayments.length > 0) {
    const paymentDates = paidPayments
      .map(payment => payment.payment_date)
      .filter(Boolean) as string[];
    if (paymentDates.length > 0) {
      lastPaymentDate = new Date(Math.max(...paymentDates.map(d => new Date(d).getTime()))).toISOString();
    }
  }

  // Group bookings by schedule ID for faster lookup
  const bookingsBySchedule: Record<string, Booking[]> = {};
  bookings.forEach(booking => {
    const scheduleId = booking.class_schedule_id;
    if (!scheduleId) return;
    
    if (!bookingsBySchedule[scheduleId]) {
      bookingsBySchedule[scheduleId] = [];
    }
    bookingsBySchedule[scheduleId].push(booking);
  });

  // Map of paid schedule IDs from trainer_payments
  const paidScheduleIds = new Set(
    paidPayments
      .filter(payment => payment.class_schedule_id)
      .map(payment => payment.class_schedule_id)
  );

  // Map of schedule IDs that have payment entries with zero amounts
  const zeroAmountScheduleIds = new Set(
    trainerPayments
      .filter(payment => payment.amount === 0 || payment.amount === 0.0)
      .map(payment => payment.class_schedule_id)
  );

  // Track if this trainer has any zero-commission classes
  let hasZeroCommissionClasses = false;
  let totalCommission = 0; // Total earned commission across all classes

  // Calculate class details and sum up earnings
  const classDetails: TrainerClassDetail[] = allSchedules.map(schedule => {
    const scheduleBookings = bookingsBySchedule[schedule.id] || [];
    const scheduleDate = new Date(schedule.start_time);
    const branchId = schedule.classes?.branch_id;
    
    // Check if this class has zero commission configured
    const trainerFeeValue = schedule.classes?.trainer_fee_value;
    const hasZeroCommission = trainerFeeValue === 0;
    
    if (hasZeroCommission) {
      hasZeroCommissionClasses = true;
    }
    
    // Get all invoice items for this schedule's bookings
    const scheduleInvoiceItems: InvoiceItem[] = [];
    
    scheduleBookings.forEach(booking => {
      const items = invoiceItems.filter(item => item.booking_id === booking.id);
      scheduleInvoiceItems.push(...items);
    });

    // Calculate revenue for this class based on NET amounts (using invoice totals)
    const revenueDetails = calculateClassRevenue(
      scheduleBookings, 
      schedule, 
      scheduleInvoiceItems
    );

    // A class is considered paid if we have it in the paidScheduleIds set from trainer_payments
    const classIsPaid = paidScheduleIds.has(schedule.id);

    // Only add to total commission if not a zero-commission class
    if (!hasZeroCommission) {
      if (classIsPaid) {
        totalCommission += revenueDetails.revenue;
      } else {
        totalCommission += revenueDetails.potentialRevenue;
      }
    }
    
    // Check if this schedule has a payment record with zero amount
    // We'll only flag it as having a "zero amount payment" if it's not supposed to have zero commission
    const hasZeroAmountPayment = !hasZeroCommission && zeroAmountScheduleIds.has(schedule.id);

    // Build booking details for this class with actual client names and dog info
    const bookingsDetails = scheduleBookings.map(booking => {
      // Use the client's first and last name when available
      let clientName = 'Unnamed Client';
      let clientEmail = '';
      
      const clientData = booking.client || booking.clients;
      if (clientData) {
        const firstName = clientData.first_name || '';
        const lastName = clientData.last_name || '';
        if (firstName || lastName) {
          clientName = `${firstName} ${lastName}`.trim();
        }
        clientEmail = clientData.email || '';
      }
      
      // Get dog info
      const dogData = booking.dog || booking.dogs;
      const dogName = dogData?.name || 'Unknown Dog';
      const dogBreed = dogData?.breed || '';
      
      // Get invoice amount for this specific booking
      const bookingInvoiceItems = invoiceItems.filter(item => item.booking_id === booking.id);
      const courseFee = bookingInvoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        
      // Calculate individual commission - either actual or potential
      const perBookingCommission = scheduleBookings.length > 0 
        ? revenueDetails.potentialRevenue / scheduleBookings.length 
        : 0;
        
      return {
        bookingId: booking.id,
        clientId: booking.client_id || '',
        handlerName: clientName,
        handlerEmail: clientEmail,
        dogName,
        dogBreed,
        commissionAmount: perBookingCommission,
        courseFee,
        paymentStatus: booking.payment_status
      };
    });

    return {
      scheduleId: schedule.id,
      className: schedule.classes?.name || 'Unknown Class',
      classDate: schedule.start_time,
      scheduleDate,
      revenue: revenueDetails.revenue,
      potentialRevenue: revenueDetails.potentialRevenue,
      bookings: scheduleBookings.length,
      isPaid: classIsPaid,
      hasZeroAmountPayment,
      hasZeroCommission,
      branchId, // Include branch ID in class details
      bookingsDetails
    };
  });

  // Calculate pending amount properly
  let pendingAmount = 0;
  
  // Get all unpaid class details
  const unpaidClassDetails = classDetails.filter(cls => !cls.isPaid && !cls.hasZeroCommission);
  
  // Sum up the potential revenue for unpaid classes
  pendingAmount = unpaidClassDetails.reduce((sum, cls) => sum + cls.potentialRevenue, 0);
  
  // Make sure pending amount is accurate by checking for zero-amount payments
  // These represent a special case where the payment record exists but has an incorrect amount
  const zeroAmountPaymentClasses = classDetails.filter(cls => cls.hasZeroAmountPayment);
  if (zeroAmountPaymentClasses.length > 0) {
    // Add the potential revenue for classes with zero-amount payments
    pendingAmount += zeroAmountPaymentClasses.reduce((sum, cls) => sum + cls.potentialRevenue, 0);
  }

  // Calculate if this trainer has unpaid amounts (used for status display)
  const hasUnpaidCommission = pendingAmount > 0;
  
  // Ensure total commission matches the sum of paid + pending
  const totalEarned = hasActualPayments ? totalPaid : totalCommission - pendingAmount;

  return {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name}`,
    trainerEmail: trainer.email,
    totalEarned: totalCommission,
    paid: totalPaid,
    pending: pendingAmount,
    potentialEarnings: totalCommission, // Same as totalEarned for consistency
    classesCount: allSchedules.length,
    clients: uniqueClientIds.size,
    lastPaymentDate,
    scheduleIds: allScheduleIds,
    hasUnpaidCommission,
    hasZeroCommissionClasses,
    classDetails: classDetails.sort((a, b) => 
      new Date(a.classDate).getTime() - new Date(b.classDate).getTime()
    )
  };
}
