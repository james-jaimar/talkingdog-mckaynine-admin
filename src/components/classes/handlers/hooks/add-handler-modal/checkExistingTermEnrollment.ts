
import { supabase } from "@/integrations/supabase/client";

export interface ExistingTermEnrollment {
  hasExistingEnrollment: boolean;
  existingDogName?: string;
  existingClassName?: string;
  existingInvoiceId?: string;
  existingInvoiceNumber?: string;
  existingInvoiceStatus?: string;
  totalDogsInTerm: number;
  existingBookingId?: string;
}

/**
 * Check if a handler has other dogs enrolled in classes within the same term.
 * This is used to apply multi-dog discounts across different classes.
 * 
 * @param handlerId - The client/handler ID
 * @param termId - The term ID to check enrollments for
 * @param currentDogIds - Array of dog IDs being enrolled (to exclude from check)
 * @returns Information about existing enrollments in the same term
 */
export const checkExistingTermEnrollment = async (
  handlerId: string,
  termId: string | null,
  currentDogIds: string[]
): Promise<ExistingTermEnrollment> => {
  // If no term ID, can't do term-based checking
  if (!termId) {
    console.log("MULTI-DOG-CHECK: No term ID provided, skipping cross-class check");
    return {
      hasExistingEnrollment: false,
      totalDogsInTerm: 0,
    };
  }

  try {
    console.log("MULTI-DOG-CHECK: Checking for existing enrollments", { 
      handlerId, 
      termId, 
      currentDogIds 
    });

    // Find other dogs belonging to this handler that are enrolled in classes this term
    // Exclude the current dog(s) being enrolled
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        dog_id,
        dogs!inner (
          id,
          name
        ),
        class_schedules!inner (
          id,
          term_id,
          classes!inner (
            id,
            name
          )
        ),
        invoice_items (
          invoice_id,
          invoices!inner (
            id,
            invoice_number,
            status
          )
        )
      `)
      .eq('client_id', handlerId)
      .eq('class_schedules.term_id', termId)
      .not('dog_id', 'in', `(${currentDogIds.join(',')})`)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error("MULTI-DOG-CHECK: Error checking existing enrollments:", error);
      return {
        hasExistingEnrollment: false,
        totalDogsInTerm: 0,
      };
    }

    if (!existingBookings || existingBookings.length === 0) {
      console.log("MULTI-DOG-CHECK: No existing enrollments found for this handler in this term");
      return {
        hasExistingEnrollment: false,
        totalDogsInTerm: 0,
      };
    }

    const existingBooking = existingBookings[0];
    const dogs = existingBooking.dogs as { id: string; name: string };
    const classSchedules = existingBooking.class_schedules as { 
      id: string; 
      term_id: string; 
      classes: { id: string; name: string } 
    };
    const invoiceItems = existingBooking.invoice_items as Array<{ 
      invoice_id: string; 
      invoices: { id: string; invoice_number: string; status: string } 
    }>;

    // Find a valid invoice (not cancelled)
    const validInvoiceItem = invoiceItems?.find(item => 
      item.invoices && item.invoices.status !== 'cancelled'
    );

    // Count total unique dogs enrolled for this handler in this term
    const { count: totalDogsCount } = await supabase
      .from('bookings')
      .select('dog_id', { count: 'exact', head: true })
      .eq('client_id', handlerId)
      .eq('class_schedules.term_id', termId);

    const result: ExistingTermEnrollment = {
      hasExistingEnrollment: true,
      existingDogName: dogs?.name,
      existingClassName: classSchedules?.classes?.name,
      existingInvoiceId: validInvoiceItem?.invoices?.id,
      existingInvoiceNumber: validInvoiceItem?.invoices?.invoice_number,
      existingInvoiceStatus: validInvoiceItem?.invoices?.status,
      existingBookingId: existingBooking.id,
      totalDogsInTerm: (totalDogsCount || 0) + currentDogIds.length,
    };

    console.log("MULTI-DOG-CHECK: Found existing enrollment", result);
    return result;
  } catch (error) {
    console.error("MULTI-DOG-CHECK: Unexpected error:", error);
    return {
      hasExistingEnrollment: false,
      totalDogsInTerm: 0,
    };
  }
};
