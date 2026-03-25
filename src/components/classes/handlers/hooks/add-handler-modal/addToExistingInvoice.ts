
import { supabase } from "@/integrations/supabase/client";
import { allocateStarterKit } from "@/hooks/useStarterKitInventory";
import { toast } from "sonner";

const MULTI_DOG_DISCOUNT_PERCENT = 25;

export interface AddToExistingInvoiceProps {
  existingInvoiceId: string;
  handlerId: string;
  dogIds: string[];
  dogNames: string[];
  bookingIds: string[];
  className: string;
  classPrice: number;
  enrollmentFee: number;
  existingDogName?: string;
  existingClassName?: string;
  classIOInventoryCode?: string | null;
}

export interface AddToExistingInvoiceResult {
  success: boolean;
  invoiceNumber?: string;
  newSubtotal?: number;
  discountApplied?: number;
  error?: string;
}

/**
 * Add new dogs to an existing invoice with multi-dog discount applied.
 * This updates an existing invoice when a handler enrolls a 2nd dog in a different class.
 */
export const addToExistingInvoice = async ({
  existingInvoiceId,
  handlerId,
  dogIds,
  dogNames,
  bookingIds,
  className,
  classPrice,
  enrollmentFee,
  existingDogName,
  existingClassName,
  classIOInventoryCode,
}: AddToExistingInvoiceProps): Promise<AddToExistingInvoiceResult> => {
  try {
    console.log("ADD-TO-INVOICE: Starting update of existing invoice", {
      existingInvoiceId,
      dogNames,
      className,
      classPrice,
    });

    // Fetch the existing invoice with its items
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        subtotal,
        total,
        notes,
        status,
        monetary_discount,
        discount_reason
      `)
      .eq('id', existingInvoiceId)
      .single();

    if (fetchError || !existingInvoice) {
      console.error("ADD-TO-INVOICE: Failed to fetch existing invoice", fetchError);
      return {
        success: false,
        error: "Could not find the existing invoice",
      };
    }

    // Don't update paid or cancelled invoices
    if (existingInvoice.status === 'paid' || existingInvoice.status === 'cancelled') {
      console.log("ADD-TO-INVOICE: Invoice is paid/cancelled, cannot update");
      return {
        success: false,
        error: `Cannot update invoice - it is already ${existingInvoice.status}`,
      };
    }

    // Guard: check for existing items on this invoice for these bookings (prevent duplicates)
    const { data: existingItems } = await supabase
      .from('invoice_items')
      .select('booking_id')
      .eq('invoice_id', existingInvoiceId)
      .in('booking_id', bookingIds);
    
    const alreadyLinkedBookings = new Set((existingItems || []).map(i => i.booking_id));
    const newBookingIds = bookingIds.filter(id => !alreadyLinkedBookings.has(id));
    
    if (newBookingIds.length === 0) {
      console.warn("ADD-TO-INVOICE: All bookings already have items on this invoice, skipping duplicate insert");
      return {
        success: true,
        invoiceNumber: existingInvoice.invoice_number,
        newSubtotal: existingInvoice.subtotal || 0,
        discountApplied: 0,
      };
    }

    // Create new invoice items for each dog being added
    const newItems: Array<{
      invoice_id: string;
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
      booking_id: string;
      item_type: string;
      io_inventory_code: string | null;
    }> = [];

    let additionalSubtotal = 0;
    let totalDiscount = 0;

    dogIds.forEach((dogId, index) => {
      const dogName = dogNames[index] || `Dog ${index + 1}`;
      const bookingId = bookingIds[index];

      // Apply 25% discount since this is a 2nd dog across classes (round to nearest cent)
      const discountAmount = Math.round(classPrice * MULTI_DOG_DISCOUNT_PERCENT) / 100;
      const discountedPrice = Math.round((classPrice - discountAmount) * 100) / 100;
      totalDiscount += discountAmount;

      // Add course fee item with discount
      newItems.push({
        invoice_id: existingInvoiceId,
        description: `${className} training class for ${dogName} (25% multi-dog discount applied)`,
        quantity: 1,
        unit_price: discountedPrice,
        amount: discountedPrice,
        booking_id: bookingId,
        item_type: 'course_fee',
        io_inventory_code: classIOInventoryCode || null,
      });

      additionalSubtotal += discountedPrice;

      // Add enrollment fee if applicable (for first dog in this batch)
      if (index === 0 && enrollmentFee > 0) {
        newItems.push({
          invoice_id: existingInvoiceId,
          description: `Enrollment fee for ${className}`,
          quantity: 1,
          unit_price: enrollmentFee,
          amount: enrollmentFee,
          booking_id: bookingId,
          item_type: 'enrollment_fee',
          io_inventory_code: 'EN',
        });
        additionalSubtotal += enrollmentFee;
      }
    });

    // Insert new invoice items
    const { data: insertedItems, error: insertError } = await supabase
      .from('invoice_items')
      .insert(newItems)
      .select();

    if (insertError) {
      console.error("ADD-TO-INVOICE: Failed to insert new items", insertError);
      return {
        success: false,
        error: "Failed to add items to invoice",
      };
    }

    // Allocate starter kit if enrollment fee was included
    if (enrollmentFee > 0 && insertedItems) {
      const enrollmentItem = insertedItems.find(item => item.item_type === 'enrollment_fee');
      if (enrollmentItem) {
        // Fetch branch_id from existing invoice
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('branch_id')
          .eq('id', existingInvoiceId)
          .single();

        const branchId = invoiceData?.branch_id;
        const dogName = dogNames[0] || 'Unknown';

        if (branchId) {
          const allocationResult = await allocateStarterKit(
            enrollmentItem.id,
            handlerId,
            dogName,
            branchId
          );

          if (allocationResult.success) {
            console.log("ADD-TO-INVOICE: Starter kit allocated, remaining:", allocationResult.remainingStock);
            if (allocationResult.remainingStock < 5) {
              toast.warning(`Low stock warning: Only ${allocationResult.remainingStock} starter kits remaining`);
            }
          } else {
            console.warn("ADD-TO-INVOICE: Starter kit allocation failed:", allocationResult.message);
            toast.warning("Could not allocate starter kit - check stock levels");
          }
        }
      }
    }

    // Calculate new totals
    const newSubtotal = (existingInvoice.subtotal || 0) + additionalSubtotal;
    const monetaryDiscount = existingInvoice.monetary_discount || 0;
    const newTotal = newSubtotal - monetaryDiscount;

    // Update invoice totals and notes
    const updatedNotes = existingInvoice.notes 
      ? `${existingInvoice.notes}\n\n[Updated] Added ${dogNames.join(", ")} to ${className} with 25% multi-dog discount.`
      : `Multi-dog discount applied. ${existingDogName || 'First dog'} in ${existingClassName || 'first class'}, ${dogNames.join(", ")} in ${className}.`;

    const discountReason = existingInvoice.discount_reason
      ? `${existingInvoice.discount_reason}; Multi-dog discount (25% off 2nd dog in different class)`
      : "Multi-dog discount (25% off 2nd dog in different class)";

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        subtotal: newSubtotal,
        total: newTotal,
        notes: updatedNotes,
        discount_reason: discountReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingInvoiceId);

    if (updateError) {
      console.error("ADD-TO-INVOICE: Failed to update invoice totals", updateError);
      return {
        success: false,
        error: "Failed to update invoice totals",
      };
    }

    console.log("ADD-TO-INVOICE: Successfully updated invoice", {
      invoiceNumber: existingInvoice.invoice_number,
      newSubtotal,
      newTotal,
      discountApplied: totalDiscount,
    });

    return {
      success: true,
      invoiceNumber: existingInvoice.invoice_number,
      newSubtotal,
      discountApplied: totalDiscount,
    };
  } catch (error) {
    console.error("ADD-TO-INVOICE: Unexpected error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Create admin notification tasks for multi-dog discount
 */
export const createMultiDogDiscountTasks = async (
  handlerId: string,
  dogName: string,
  className: string,
  existingDogName: string,
  existingClassName: string,
  invoiceNumber: string,
  discountAmount: number
): Promise<void> => {
  try {
    const tasks = [
      {
        handler_id: handlerId,
        task_type: "billing_review",
        title: "Multi-dog discount applied across classes",
        description: `${dogName} added to ${className}. R${discountAmount} discount (25%) applied as ${existingDogName} is already enrolled in ${existingClassName} this term.`,
        status: "pending",
      },
      {
        handler_id: handlerId,
        task_type: "send_invoice",
        title: "Review and send updated invoice",
        description: `Invoice ${invoiceNumber} has been updated with additional class for ${dogName}. Please review and send to handler.`,
        status: "pending",
      },
    ];

    const { error } = await supabase
      .from('handler_tasks')
      .insert(tasks);

    if (error) {
      console.error("MULTI-DOG-TASKS: Failed to create notification tasks", error);
    } else {
      console.log("MULTI-DOG-TASKS: Created admin notification tasks");
    }
  } catch (error) {
    console.error("MULTI-DOG-TASKS: Unexpected error creating tasks", error);
  }
};
