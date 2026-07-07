
import { UseMutationResult } from "@tanstack/react-query";
import { calculateInvoiceComponents } from "@/lib/calculateInvoiceComponents";
import { createInvoice } from "@/lib/invoices/createInvoiceUtils";
import { allocateStarterKit } from "@/hooks/useStarterKitInventory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreateInvoiceProps {
  handlerId: string;
  dogIds: string[];
  bookingIds: string[];
  className: string;
  classPrice: number;
  dogNames: string[];
  generateInvoiceNumber: (referenceDate?: Date) => Promise<string>;
  createInvoice: UseMutationResult<any, Error, any, unknown>;
  currentBranch?: { id: string; name: string } | null;
  enrollmentFee?: number;
  classDate?: Date;
  classBranchId?: string;
  classReportMonthOverride?: string | null;
  classIOInventoryCode?: string | null;
  classTermId?: string | null;
}

const MULTI_DOG_DISCOUNT_PERCENT = 25; // 25% discount for 2nd dog

export const createInvoiceForHandler = async ({
  handlerId,
  dogIds,
  bookingIds,
  className,
  classPrice,
  dogNames,
  generateInvoiceNumber,
  createInvoice: createInvoiceMutation,
  currentBranch,
  enrollmentFee = 0,
  classDate,
  classBranchId,
  classReportMonthOverride,
  classIOInventoryCode,
  classTermId,
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    console.log("CREATE-INVOICE: Starting invoice creation with params:", {
      handlerId, dogIds, bookingIds, className, classPrice, enrollmentFee, dogNames, classReportMonthOverride
    });

    // Generate invoice number with fallback - use classDate for proper period
    let invoiceNumber: string;
    try {
      invoiceNumber = await generateInvoiceNumber(classDate);
    } catch (error) {
      console.error("Failed to generate invoice number, using fallback:", error);
      const dateToUse = classDate || new Date();
      const year = dateToUse.getFullYear().toString().slice(-2);
      const month = (dateToUse.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = dateToUse.getTime().toString().slice(-4);
      let branchCode = "X";
      
      if (currentBranch?.name) {
        if (currentBranch.name.toLowerCase().includes('delta')) branchCode = "D";
        else if (currentBranch.name.toLowerCase().includes('randburg')) branchCode = "R";
        else branchCode = currentBranch.name.charAt(0).toUpperCase();
      }
      
      invoiceNumber = `INV-Mc${branchCode}-${year}${month}-${timestamp.padStart(4, '0')}`;
    }

    // Validate input parameters
    if (typeof classPrice !== 'number' || isNaN(classPrice)) {
      console.error("CREATE-INVOICE: Invalid classPrice:", classPrice);
      classPrice = 0;
    }
    
    if (typeof enrollmentFee !== 'number' || isNaN(enrollmentFee)) {
      console.error("CREATE-INVOICE: Invalid enrollmentFee:", enrollmentFee);
      enrollmentFee = 0;
    }

    // Create invoice items for each dog
    const items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      booking_id: string;
      item_type: string;
      io_inventory_code?: string;
    }> = [];

    let subtotal = 0;
    let totalDiscount = 0;

    // Validate that we have matching arrays before processing
    if (dogIds.length !== bookingIds.length || dogIds.length !== dogNames.length) {
      console.error("CREATE-INVOICE: Array length mismatch", { 
        dogIds: dogIds.length, 
        bookingIds: bookingIds.length, 
        dogNames: dogNames.length 
      });
      throw new Error("Mismatch in dog, booking, or name arrays");
    }

    dogIds.forEach((dogId, index) => {
      const dogName = dogNames[index] || `Dog ${index + 1}`;
      const bookingId = bookingIds[index];
      const isSecondDog = index === 1;
      
      // Validate booking ID exists for this dog
      if (!bookingId) {
        console.error(`CREATE-INVOICE: Missing booking ID for dog ${dogName} at index ${index}`);
        throw new Error(`Missing booking ID for ${dogName}`);
      }
      
      // Calculate price for this dog
      let dogClassPrice = classPrice;
      let discountNote = "";
      
      if (isSecondDog) {
        // Apply 25% discount to 2nd dog's course fee (round to nearest cent)
        const discountAmount = Math.round(classPrice * MULTI_DOG_DISCOUNT_PERCENT) / 100;
        dogClassPrice = Math.round((classPrice - discountAmount) * 100) / 100;
        totalDiscount += discountAmount;
        discountNote = ` (25% multi-dog discount applied)`;
      }
      
      // Add course fee item for this dog
      items.push({
        description: `${className} training class for ${dogName}${discountNote}`,
        quantity: 1,
        unit_price: dogClassPrice,
        booking_id: bookingId,
        item_type: 'course_fee',
        io_inventory_code: classIOInventoryCode || undefined,
      });
      
      subtotal += dogClassPrice;
      
      // Add enrollment fee for first dog only
      if (index === 0 && enrollmentFee && enrollmentFee > 0) {
        items.push({
          description: `Enrollment fee for ${className}`,
          quantity: 1,
          unit_price: enrollmentFee,
          booking_id: bookingId,
          item_type: 'enrollment_fee',
          io_inventory_code: 'EN',
        });
        subtotal += enrollmentFee;
      }
    });

    console.log("CREATE-INVOICE: Items created:", items);
    console.log("CREATE-INVOICE: Subtotal:", subtotal, "Total discount:", totalDiscount);

    // Use class date if provided (for backfilling), otherwise use today
    const invoiceDate = classDate || new Date();
    const dueDate = invoiceDate; // Due date defaults to same as issued date

    // Create the invoice data object
    // Use classBranchId for proper branch attribution (supports multi-branch handlers)
    const invoiceData = {
      client_id: handlerId,
      invoice_number: invoiceNumber,
      status: "draft",
      issued_date: invoiceDate,
      due_date: dueDate,
      notes: dogIds.length === 2 
        ? `Invoice for ${className} training class for ${dogNames.join(" and ")}. Multi-dog discount applied.`
        : `Invoice for ${className} training class for ${dogNames[0]}.`,
      tax_rate: 0,
      items,
      discount_type: "fixed" as const,
      discount_amount: 0, // Discount is already applied in item prices
      discount_reason: totalDiscount > 0 ? "Multi-dog discount (25% off 2nd dog)" : "",
      subtotal,
      total: subtotal,
      monetary_discount: 0,
      branch_id: classBranchId || currentBranch?.id || null, // Use class branch for proper attribution
      report_month_override: classReportMonthOverride || null, // Pass override to invoice creation
      term_id: classTermId || null, // Link invoice to the class's term
    };

    console.log("CREATE-INVOICE: About to create invoice with data:", invoiceData);

    // ---- MERGE-INTO-DRAFT: if handler already has a draft invoice for this branch,
    // append the new items instead of creating a new invoice.
    try {
      const branchForMatch = classBranchId || currentBranch?.id || null;
      const draftQuery = supabase
        .from('invoices')
        .select('id, invoice_number, subtotal, notes')
        .eq('client_id', handlerId)
        .eq('status', 'draft');
      const { data: existingDrafts, error: draftErr } = branchForMatch
        ? await draftQuery.eq('branch_id', branchForMatch).order('created_at', { ascending: false }).limit(1)
        : await draftQuery.is('branch_id', null).order('created_at', { ascending: false }).limit(1);

      if (draftErr) {
        console.warn("CREATE-INVOICE: draft lookup failed, will create new invoice:", draftErr);
      } else if (existingDrafts && existingDrafts.length > 0) {
        const draft = existingDrafts[0];
        console.log("CREATE-INVOICE: Found existing draft, appending items:", draft.invoice_number);

        const newItemsRows = items.map((item) => ({
          invoice_id: draft.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
          booking_id: item.booking_id || null,
          item_type: item.item_type || 'course_fee',
          io_inventory_code: item.io_inventory_code || null,
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from('invoice_items')
          .insert(newItemsRows)
          .select();

        if (itemsError) {
          console.error("CREATE-INVOICE: Failed to append items to draft, falling back to new invoice:", itemsError);
        } else {
          const newSubtotal = Number(draft.subtotal || 0) + subtotal;
          const appendedNote = dogIds.length === 2
            ? `Added ${className} for ${dogNames.join(" and ")} (multi-dog discount).`
            : `Added ${className} for ${dogNames[0]}.`;
          const combinedNotes = draft.notes ? `${draft.notes}\n${appendedNote}` : appendedNote;

          const { error: updateErr } = await supabase
            .from('invoices')
            .update({ subtotal: newSubtotal, notes: combinedNotes })
            .eq('id', draft.id);

          if (updateErr) {
            console.error("CREATE-INVOICE: Failed to update draft totals:", updateErr);
            // Best-effort: still allocate starter kit if applicable
          }

          // Allocate starter kit if enrollment fee item was appended
          if (enrollmentFee && enrollmentFee > 0 && insertedItems) {
            const enrollmentFeeItem = insertedItems.find(
              (item: any) => item.item_type === 'enrollment_fee'
            );
            if (enrollmentFeeItem?.id) {
              const branchId = classBranchId || currentBranch?.id;
              const dogName = dogNames[0] || 'Unknown';
              if (branchId) {
                const allocationResult = await allocateStarterKit(
                  enrollmentFeeItem.id,
                  handlerId,
                  dogName,
                  branchId
                );
                if (allocationResult.success && allocationResult.remainingStock < 5) {
                  toast.warning(`Low stock warning: Only ${allocationResult.remainingStock} starter kits remaining`);
                } else if (!allocationResult.success) {
                  toast.warning("Could not allocate starter kit - check stock levels");
                }
              }
            }
          }

          toast.success(`Added to existing draft invoice ${draft.invoice_number}`);
          return true;
        }
      }
    } catch (mergeErr) {
      console.warn("CREATE-INVOICE: merge-into-draft check failed, creating new invoice:", mergeErr);
    }


    try {
      // Use the mutation function to create the invoice through our centralized utility
      const result = await createInvoiceMutation.mutateAsync(invoiceData);
      console.log("CREATE-INVOICE: Invoice created successfully");
      
      // After invoice creation, allocate starter kit if enrollment fee was included
      if (enrollmentFee && enrollmentFee > 0 && result?.items) {
        // Find the enrollment fee invoice item from the returned items (with actual DB IDs)
        const enrollmentFeeItem = result.items.find(
          (item: any) => item.item_type === 'enrollment_fee'
        );
        
        if (enrollmentFeeItem?.id) {
          const branchId = classBranchId || currentBranch?.id;
          const dogName = dogNames[0] || 'Unknown';
          
          if (branchId) {
            const allocationResult = await allocateStarterKit(
              enrollmentFeeItem.id, // Use the actual invoice_item_id from DB
              handlerId,
              dogName,
              branchId
            );
            
            if (allocationResult.success) {
              console.log("CREATE-INVOICE: Starter kit allocated, remaining:", allocationResult.remainingStock);
              if (allocationResult.remainingStock < 5) {
                toast.warning(`Low stock warning: Only ${allocationResult.remainingStock} starter kits remaining`);
              }
            } else {
              console.warn("CREATE-INVOICE: Starter kit allocation failed:", allocationResult.message);
              toast.warning("Could not allocate starter kit - check stock levels");
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error("CREATE-INVOICE: Failed to create invoice with mutateAsync", error);
      
      // Try direct creation as a fallback (bypass React Query)
      try {
        console.log("CREATE-INVOICE: Attempting direct invoice creation as fallback");
        await createInvoice(invoiceData);
        console.log("CREATE-INVOICE: Direct invoice creation successful");
        return true;
      } catch (directError) {
        console.error("CREATE-INVOICE: Direct invoice creation also failed:", directError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error in createInvoiceForHandler OUTER catch:", error);
    return false;
  }
};
