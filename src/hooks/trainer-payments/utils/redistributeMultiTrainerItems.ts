import { InvoiceItem, Booking, Schedule } from "../types";

/**
 * Detects multi-trainer household invoices and redistributes course fee amounts
 * evenly across trainers so commission is calculated fairly.
 *
 * Example: Invoice has 2 items for 2 trainers totalling R3,007.50.
 * Instead of Trainer A getting commission on R1,680 and Trainer B on R1,327.50,
 * both get commission on R1,503.75 (R3,007.50 ÷ 2).
 *
 * Only course_fee items are redistributed; enrollment_fee items stay untouched.
 * Returns a new array with adjusted amount/unit_price — does NOT mutate originals.
 */
export function redistributeMultiTrainerItems(
  invoiceItems: InvoiceItem[],
  bookings: Booking[],
  schedules: Schedule[]
): InvoiceItem[] {
  if (invoiceItems.length === 0) return [];

  // Build lookup maps
  const bookingMap = new Map<string, Booking>();
  bookings.forEach(b => bookingMap.set(b.id, b));

  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach(s => scheduleMap.set(s.id, s));

  // Resolve trainer for an invoice item via booking → schedule → trainer_id
  function resolveTrainerId(item: InvoiceItem): string | null {
    if (!item.booking_id) return null;
    const booking = bookingMap.get(item.booking_id);
    if (!booking) return null;
    const schedule = scheduleMap.get(booking.class_schedule_id);
    if (!schedule) return null;
    return schedule.trainer_id;
  }

  // Group items by invoice_id
  const itemsByInvoice = new Map<string, InvoiceItem[]>();
  invoiceItems.forEach(item => {
    const key = item.invoice_id;
    const group = itemsByInvoice.get(key) || [];
    group.push(item);
    itemsByInvoice.set(key, group);
  });

  const result: InvoiceItem[] = [];

  for (const [, items] of itemsByInvoice) {
    // Separate course fee items from enrollment fee items
    const courseFeeItems = items.filter(i => i.item_type !== 'enrollment_fee');
    const enrollmentFeeItems = items.filter(i => i.item_type === 'enrollment_fee');

    // Find distinct trainers for course fee items
    const trainerToItems = new Map<string, InvoiceItem[]>();
    const unresolvableItems: InvoiceItem[] = [];

    courseFeeItems.forEach(item => {
      const trainerId = resolveTrainerId(item);
      if (trainerId) {
        const group = trainerToItems.get(trainerId) || [];
        group.push(item);
        trainerToItems.set(trainerId, group);
      } else {
        unresolvableItems.push(item);
      }
    });

    const distinctTrainers = trainerToItems.size;

    // Only redistribute if multiple trainers share the same invoice
    if (distinctTrainers <= 1) {
      // No redistribution needed — pass through unchanged
      result.push(...items);
      continue;
    }

    // Calculate total course fee amount across all trainers
    const totalCourseFees = courseFeeItems.reduce((sum, i) => sum + (i.amount || 0), 0);
    const sharePerTrainer = totalCourseFees / distinctTrainers;

    console.log(
      `[redistributeMultiTrainerItems] Invoice ${items[0]?.invoice_id}: ` +
      `${distinctTrainers} trainers, total course fees R${totalCourseFees.toFixed(2)}, ` +
      `share per trainer R${sharePerTrainer.toFixed(2)}`
    );

    // Scale each trainer's items so their total equals sharePerTrainer
    for (const [trainerId, trainerItems] of trainerToItems) {
      const trainerTotal = trainerItems.reduce((sum, i) => sum + (i.amount || 0), 0);

      if (trainerTotal === 0) {
        // Avoid division by zero — pass through as-is
        result.push(...trainerItems);
        continue;
      }

      const scaleFactor = sharePerTrainer / trainerTotal;

      trainerItems.forEach(item => {
        result.push({
          ...item,
          amount: Math.round(item.amount * scaleFactor * 100) / 100,
          unit_price: Math.round(item.unit_price * scaleFactor * 100) / 100,
        });
      });
    }

    // Pass through unresolvable course fee items and enrollment fee items unchanged
    result.push(...unresolvableItems);
    result.push(...enrollmentFeeItems);
  }

  return result;
}
