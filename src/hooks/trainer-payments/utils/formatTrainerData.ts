
import { TrainerPaymentData, TrainerClassDetail, Schedule, Booking, InvoiceItem } from "../types";
import { calculateClassRevenue } from "./calculateTrainerFees";

export function formatTrainerPaymentData(
  trainer: { id: string; first_name: string; last_name: string; email?: string },
  allSchedules: Schedule[],
  bookings: Booking[] = [],
  invoiceItems: InvoiceItem[] = [],
  trainerPayments: any[] = []
): TrainerPaymentData {
  const allScheduleIds = allSchedules.map(s => s.id);
  const uniqueClientIds = new Set(bookings?.map(b => b.client_id).filter(Boolean));

  // Calculate totals from all class details first
  let totalPotentialEarnings = 0;
  let totalEarned = 0;
  
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
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Calculate pending amount from pending payments
  const totalPending = trainerPayments
    .filter(payment => payment.status === 'pending')
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

  // Calculate class details and sum up earnings
  const classDetails: TrainerClassDetail[] = allSchedules.map(schedule => {
    const scheduleBookings = bookingsBySchedule[schedule.id] || [];
    const scheduleDate = new Date(schedule.start_time);
    
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

    // Add to total potential earnings
    totalPotentialEarnings += revenueDetails.potentialRevenue;
    
    // Add to total earned if class is paid
    if (paidScheduleIds.has(schedule.id)) {
      totalEarned += revenueDetails.potentialRevenue;
    }

    // A class is considered paid if we have it in the paidScheduleIds set from trainer_payments
    const classIsPaid = paidScheduleIds.has(schedule.id);

    // Build booking details for this class with actual client names
    const bookingsDetails = scheduleBookings.map(booking => {
      // Use the client's first and last name when available
      let clientName = 'Unnamed Client';
      
      if (booking.client) {
        const firstName = booking.client.first_name || '';
        const lastName = booking.client.last_name || '';
        if (firstName || lastName) {
          clientName = `${firstName} ${lastName}`.trim();
        }
      } else if (booking.clients) {
        // Fallback to clients property if client is not available
        const firstName = booking.clients.first_name || '';
        const lastName = booking.clients.last_name || '';
        if (firstName || lastName) {
          clientName = `${firstName} ${lastName}`.trim();
        }
      }
        
      // Calculate individual commission - either actual or potential
      const perBookingCommission = scheduleBookings.length > 0 
        ? revenueDetails.potentialRevenue / scheduleBookings.length 
        : 0;
        
      return {
        bookingId: booking.id,
        clientId: booking.client_id || '',
        handlerName: clientName,
        commissionAmount: perBookingCommission
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
      bookingsDetails
    };
  });

  // FIX: Calculate pending amount properly
  let pendingAmount = 0;
  
  // If we have actual payment records, use those for the pending amount calculation
  if (hasActualPayments) {
    pendingAmount = totalPending;
    
    // For trainers with both paid and pending classes, we need to check if all pending
    // payments are properly accounted for in the trainer_payments table
    const pendingClassDetails = classDetails.filter(cls => !cls.isPaid);
    const pendingScheduleIds = pendingClassDetails.map(cls => cls.scheduleId);
    
    // Check if we have payment records for all pending classes
    const pendingSchedulesWithRecords = new Set(
      trainerPayments
        .filter(payment => payment.status === 'pending')
        .map(payment => payment.class_schedule_id)
    );
    
    // Calculate potential earnings for classes that don't have payment records
    for (const cls of pendingClassDetails) {
      if (!pendingSchedulesWithRecords.has(cls.scheduleId)) {
        pendingAmount += cls.potentialRevenue;
      }
    }
  } else {
    // If no actual payment records, calculate from class details
    pendingAmount = classDetails
      .filter(cls => !cls.isPaid)
      .reduce((sum, cls) => sum + cls.potentialRevenue, 0);
  }

  return {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name}`,
    trainerEmail: trainer.email,
    totalEarned: hasActualPayments ? totalPaid : totalEarned,
    paid: totalPaid,
    pending: pendingAmount, // Use our fixed pending calculation
    potentialEarnings: totalPotentialEarnings,
    classesCount: allSchedules.length,
    clients: uniqueClientIds.size,
    lastPaymentDate,
    scheduleIds: allScheduleIds,
    classDetails: classDetails.sort((a, b) => 
      new Date(a.classDate).getTime() - new Date(b.classDate).getTime()
    )
  };
}
