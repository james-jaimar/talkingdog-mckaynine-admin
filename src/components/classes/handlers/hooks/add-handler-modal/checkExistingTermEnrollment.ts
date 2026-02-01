
import { supabase } from "@/integrations/supabase/client";
import { getHouseholdMemberIds } from "@/hooks/useHouseholdLinks";

export interface ExistingTermEnrollment {
  hasExistingEnrollment: boolean;
  existingDogName?: string;
  existingClassName?: string;
  existingInvoiceId?: string;
  existingInvoiceNumber?: string;
  existingInvoiceStatus?: string;
  totalDogsInTerm: number;
  existingBookingId?: string;
  // Household-specific fields
  isHouseholdEnrollment?: boolean;
  existingHandlerId?: string;
  existingHandlerName?: string;
}

/**
 * Check if a handler (or any household member) has dogs enrolled in classes within the same term AND branch.
 * This is used to apply multi-dog discounts across different classes and households.
 * Multi-dog discounts only apply within the same branch.
 * 
 * @param handlerId - The client/handler ID
 * @param termId - The term ID to check enrollments for
 * @param currentDogIds - Array of dog IDs being enrolled (to exclude from check)
 * @param branchId - The branch ID of the class being enrolled in (for same-branch filtering)
 * @returns Information about existing enrollments in the same term and branch
 */
export const checkExistingTermEnrollment = async (
  handlerId: string,
  termId: string | null,
  currentDogIds: string[],
  branchId?: string
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
    // Get all household member IDs (includes the current handler)
    const householdMemberIds = await getHouseholdMemberIds(handlerId);
    const isPartOfHousehold = householdMemberIds.length > 1;

    console.log("MULTI-DOG-CHECK: Checking for existing enrollments", { 
      handlerId, 
      termId, 
      currentDogIds,
      branchId,
      householdMemberIds,
      isPartOfHousehold,
    });

    // Find dogs belonging to ANY household member that are enrolled in classes this term
    // Exclude the current dog(s) being enrolled
    // Also filter by branch to ensure multi-dog discounts only apply within same branch
    let query = supabase
      .from('bookings')
      .select(`
        id,
        dog_id,
        client_id,
        dogs!inner (
          id,
          name
        ),
        clients!inner (
          id,
          first_name,
          last_name
        ),
        class_schedules!inner (
          id,
          term_id,
          classes!inner (
            id,
            name,
            branch_id
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
      .in('client_id', householdMemberIds)
      .eq('class_schedules.term_id', termId)
      .not('dog_id', 'in', `(${currentDogIds.join(',')})`);

    // Only apply branch filter if branchId is provided
    if (branchId) {
      query = query.eq('class_schedules.classes.branch_id', branchId);
    }

    const { data: existingBookings, error } = await query
      .order('created_at', { ascending: false }); // Newest first, no limit

    if (error) {
      console.error("MULTI-DOG-CHECK: Error checking existing enrollments:", error);
      return {
        hasExistingEnrollment: false,
        totalDogsInTerm: 0,
      };
    }

    if (!existingBookings || existingBookings.length === 0) {
      console.log("MULTI-DOG-CHECK: No existing enrollments found for this handler/household in this term/branch");
      return {
        hasExistingEnrollment: false,
        totalDogsInTerm: 0,
      };
    }

    // Filter to only bookings that have a draft or sent invoice
    // Paid invoices should be ignored for household discount purposes
    const bookingWithDraftInvoice = existingBookings.find(booking => {
      const invoiceItems = booking.invoice_items as Array<{ 
        invoice_id: string; 
        invoices: { id: string; invoice_number: string; status: string } 
      }>;
      
      return invoiceItems?.some(item => 
        item.invoices && 
        (item.invoices.status === 'draft' || item.invoices.status === 'sent')
      );
    });

    // If no booking has a draft/sent invoice, no discount applies
    if (!bookingWithDraftInvoice) {
      console.log("MULTI-DOG-CHECK: Existing bookings found but all have paid/cancelled invoices - no discount applicable");
      return {
        hasExistingEnrollment: false,
        totalDogsInTerm: 0,
      };
    }

    const existingBooking = bookingWithDraftInvoice;
    const dogs = existingBooking.dogs as { id: string; name: string };
    const clients = existingBooking.clients as { id: string; first_name: string; last_name: string };
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

    // Determine if this is a household enrollment (different handler)
    const isHouseholdEnrollment = existingBooking.client_id !== handlerId;

    // Count total unique dogs enrolled for all household members in this term
    const { count: totalDogsCount } = await supabase
      .from('bookings')
      .select('dog_id', { count: 'exact', head: true })
      .in('client_id', householdMemberIds)
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
      // Household-specific fields
      isHouseholdEnrollment,
      existingHandlerId: existingBooking.client_id,
      existingHandlerName: isHouseholdEnrollment 
        ? `${clients?.first_name} ${clients?.last_name}` 
        : undefined,
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
