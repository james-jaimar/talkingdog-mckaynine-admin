
import { TrainerPaymentData, TrainerClassDetail, Schedule, Booking, InvoiceItem } from "../types";
import { calculateClassRevenue } from "./calculateTrainerFees";

export function formatTrainerPaymentData(
  trainer: { id: string; first_name: string; last_name: string },
  allSchedules: Schedule[],
  bookings: Booking[] = [],
  invoiceItems: InvoiceItem[] = []
): TrainerPaymentData {
  const allScheduleIds = allSchedules.map(s => s.id);
  const uniqueClientIds = new Set(bookings?.map(b => b.client_id).filter(Boolean));

  // Map class details
  const classDetails: TrainerClassDetail[] = allSchedules.map(schedule => {
    const scheduleBookings = bookings?.filter(b => b.class_schedule_id === schedule.id) || [];
    const scheduleInvoiceItems = invoiceItems.filter(item => 
      scheduleBookings.some(booking => booking.id === item.booking_id)
    );
    
    const scheduleDate = new Date(schedule.start_time);
    const { revenue, isPaid } = calculateClassRevenue(scheduleInvoiceItems, schedule);

    return {
      scheduleId: schedule.id,
      className: schedule.classes?.name || 'Unknown Class',
      classDate: schedule.start_time,
      scheduleDate,
      revenue,
      bookings: scheduleBookings.length,
      isPaid
    };
  });

  // Calculate totals
  const totalEarned = classDetails.reduce((sum, detail) => sum + detail.revenue, 0);
  const paidClasses = classDetails.filter(detail => detail.isPaid);
  const paid = paidClasses.reduce((sum, detail) => sum + detail.revenue, 0);

  // Find last payment date from invoice items
  const paidItems = invoiceItems.filter(item => item.invoices?.status === 'paid');
  let lastPaymentDate: string | undefined;
  if (paidItems.length > 0) {
    const paymentDates = paidItems
      .map(item => item.invoices?.payment_date)
      .filter(Boolean) as string[];
    if (paymentDates.length > 0) {
      lastPaymentDate = new Date(Math.max(...paymentDates.map(d => new Date(d).getTime()))).toISOString();
    }
  }

  return {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name}`,
    totalEarned,
    paid,
    pending: totalEarned - paid,
    classesCount: allSchedules.length,
    clients: uniqueClientIds.size,
    lastPaymentDate,
    scheduleIds: allScheduleIds,
    classDetails: classDetails.sort((a, b) => a.scheduleDate.getTime() - b.scheduleDate.getTime())
  };
}
