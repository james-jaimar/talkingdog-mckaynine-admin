
import { TrainerPaymentData, TrainerClassDetail, Schedule, Booking, InvoiceItem } from "../types";

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
  const totalEarned = trainerPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const paidPayments = trainerPayments.filter(payment => payment.status === 'paid');
  const paid = paidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const pending = trainerPayments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Find last payment date from actual payments
  let lastPaymentDate: string | undefined;
  if (paidPayments.length > 0) {
    const paymentDates = paidPayments
      .map(payment => payment.payment_date)
      .filter(Boolean) as string[];
    if (paymentDates.length > 0) {
      lastPaymentDate = new Date(Math.max(...paymentDates.map(d => new Date(d).getTime()))).toISOString();
    }
  }

  // Map class details but only include actual payments
  const classDetails: TrainerClassDetail[] = allSchedules.map(schedule => {
    const schedulePayments = trainerPayments.filter(p => p.class_schedule_id === schedule.id);
    const scheduleDate = new Date(schedule.start_time);
    const revenue = schedulePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const isPaid = schedulePayments.some(payment => payment.status === 'paid');

    return {
      scheduleId: schedule.id,
      className: schedule.classes?.name || 'Unknown Class',
      classDate: schedule.start_time,
      scheduleDate,
      revenue,
      bookings: bookings.filter(b => b.class_schedule_id === schedule.id).length,
      isPaid
    };
  });

  return {
    id: trainer.id,
    trainerName: `${trainer.first_name} ${trainer.last_name}`,
    totalEarned,
    paid,
    pending,
    classesCount: allSchedules.length,
    clients: uniqueClientIds.size,
    lastPaymentDate,
    scheduleIds: allScheduleIds,
    classDetails: classDetails.sort((a, b) => a.scheduleDate.getTime() - b.scheduleDate.getTime())
  };
}
