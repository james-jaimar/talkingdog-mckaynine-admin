export interface BookingTermLike {
  id: string;
  class_schedules?: {
    term_id?: string | null;
  } | null;
}

export function validateBookingsForInvoiceTerm(
  bookings: BookingTermLike[],
  invoiceTermId?: string | null
): string | null {
  if (!invoiceTermId) return "Select an active term before creating the invoice";

  const missingTerm = bookings.some((booking) => !booking.class_schedules?.term_id);
  if (missingTerm) return "One or more bookings do not have a term assigned";

  const wrongTerm = bookings.some(
    (booking) => booking.class_schedules?.term_id !== invoiceTermId
  );
  if (wrongTerm) return "Every selected booking must belong to the active invoice term";

  return null;
}