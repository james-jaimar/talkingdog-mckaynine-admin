
import { TrainerPaymentData, TrainerClassDetail, Schedule, Booking, InvoiceItem } from "../types";
import { calculateClassRevenue } from "./calculateTrainerFees";

export function formatTrainerPaymentData(
  trainer: { id: string; first_name: string; last_name: string },
  allSchedules: Schedule[],
  bookings: Booking[] = [],
  invoiceItems: InvoiceItem[] = [],
  trainerPayments: any[] = []
): TrainerPaymentData {
  const allScheduleIds = allSchedules.map(s => s.id);
  const uniqueClientIds = new Set(bookings?.map(b => b.client_id).filter(Boolean));

  // Calculate totals from actual payments
  const totalPaid = trainerPayments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const totalPending = trainerPayments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

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
    if (!bookingsBySchedule[scheduleId]) {
      bookingsBySchedule[scheduleId] = [];
    }
    bookingsBySchedule[scheduleId].push(booking);
  });

  // Group invoice items by booking ID for faster lookup
  const invoiceItemsByBooking: Record<string, InvoiceItem[]> = {};
  invoiceItems.forEach(item => {
    if (item.booking_id) {
      if (!invoiceItemsByBooking[item.booking_id]) {
        invoiceItemsByBooking[item.booking_id] = [];
      }
      invoiceItemsByBooking[item.booking_id].push(item);
    }
  });

  // Calculate potential earnings and other class details
  let totalPotentialEarnings = 0;

  const classDetails: TrainerClassDetail[] = allSchedules.map(schedule => {
    const scheduleBookings = bookingsBySchedule[schedule.id] || [];
    const scheduleDate = new Date(schedule.start_time);
    
    // Get all invoice items for this schedule's bookings
    const scheduleInvoiceItems: InvoiceItem[] = [];
    scheduleBookings.forEach(booking => {
      const items = invoiceItemsByBooking[booking.id] || [];
      scheduleInvoiceItems.push(...items);
    });

    // Calculate revenue for this class
    const revenueDetails = calculateClassRevenue(scheduleBookings, schedule, scheduleInvoiceItems);

    // Add to total potential earnings
    totalPotentialEarnings += revenueDetails.potentialRevenue;

    return {
      scheduleId: schedule.id,
      className: schedule.classes?.name || 'Unknown Class',
      classDate: schedule.start_time,
      scheduleDate,
      revenue: revenueDetails.revenue,
      potentialRevenue: revenueDetails.potentialRevenue,
      bookings: scheduleBookings.length,
      isPaid: revenueDetails.isPaid
    };
  });

  // Calculate total earned (sum of paid + pending, or potential earnings if there are no payments)
  const totalEarned = totalPaid + totalPending > 0 
    ? totalPaid + totalPending 
    : totalPotentialEarnings;

  return {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name}`,
    totalEarned, // This is now the potential earnings if no actual payments exist
    paid: totalPaid,
    pending: totalPaid + totalPending > 0 ? totalPending : totalPotentialEarnings, // If no payments, show potential as pending
    potentialEarnings: totalPotentialEarnings, // New field to track potential earnings
    classesCount: allSchedules.length,
    clients: uniqueClientIds.size,
    lastPaymentDate,
    scheduleIds: allScheduleIds,
    classDetails: classDetails.sort((a, b) => a.scheduleDate.getTime() - b.scheduleDate.getTime())
  };
}
