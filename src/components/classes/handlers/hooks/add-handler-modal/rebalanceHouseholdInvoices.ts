import { supabase } from "@/integrations/supabase/client";

export interface RebalanceResult {
  success: boolean;
  firstInvoiceNewTotal?: number;
  secondInvoiceNewTotal?: number;
  totalDiscount?: number;
  error?: string;
  firstInvoiceNumber?: string;
}

interface RebalanceParams {
  existingInvoiceId: string;
  newHandlerId: string;
  newDogIds: string[];
  newDogNames: string[];
  newBookingIds: string[];
  newClassName: string;
  newClassPrice: number;
  newEnrollmentFee: number;
  newClassDate: string;
  newClassBranchId: string;
  existingHandlerId: string;
  adminFeeType?: string;
  adminFeeValue?: number;
  trainerFeeType?: string;
  trainerFeeValue?: number;
  franchiseFeeType?: string;
  franchiseFeeValue?: number;
}

/**
 * Rebalances invoices for a household when the second handler enrolls.
 * 
 * Logic:
 * 1. Get the first handler's invoice and calculate their original course fees
 * 2. Combine with the new handler's course fees
 * 3. Apply 25% household discount to the combined total
 * 4. Split 50/50 between both invoices
 * 5. Update the first invoice's amounts
 * 6. Create new invoice for second handler with their share
 */
export async function rebalanceHouseholdInvoices(params: RebalanceParams): Promise<RebalanceResult> {
  const {
    existingInvoiceId,
    newHandlerId,
    newDogIds,
    newDogNames,
    newBookingIds,
    newClassName,
    newClassPrice,
    newEnrollmentFee,
    newClassDate,
    newClassBranchId,
    existingHandlerId,
  } = params;

  try {
    console.log("HOUSEHOLD-REBALANCE: Starting rebalance", {
      existingInvoiceId,
      newHandlerId,
      newClassPrice,
      newEnrollmentFee,
    });

    // 1. Get the existing invoice with its items
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        client_id,
        subtotal,
        total,
        status,
        branch_id,
        invoice_items (
          id,
          description,
          amount,
          unit_price,
          quantity,
          booking_id,
          item_type
        )
      `)
      .eq('id', existingInvoiceId)
      .single();

    if (invoiceError || !existingInvoice) {
      console.error("HOUSEHOLD-REBALANCE: Could not fetch existing invoice", invoiceError);
      return { success: false, error: "Could not fetch existing invoice" };
    }

    // Check if invoice is already paid - can't modify paid invoices
    if (existingInvoice.status === 'paid') {
      console.log("HOUSEHOLD-REBALANCE: Existing invoice is paid, creating task for manual adjustment");
      
      // Create admin task for manual review
      await supabase.from('handler_tasks').insert({
        handler_id: newHandlerId,
        task_type: 'household_discount_review',
        title: 'Household discount needs manual adjustment',
        description: `Handler was added to ${newClassName}, but the existing household invoice (${existingInvoice.invoice_number}) is already paid. Manual credit/adjustment may be needed to apply the household discount fairly.`,
        status: 'pending',
      });

      return { 
        success: false, 
        error: "Existing invoice is paid - created task for manual review",
        firstInvoiceNumber: existingInvoice.invoice_number,
      };
    }

    // 2. Calculate the original course fee from the existing invoice
    // We look at course_fee type items (not enrollment fees)
    const existingCourseFeeItems = existingInvoice.invoice_items?.filter(
      (item: any) => item.item_type === 'course_fee' || !item.item_type
    ) || [];
    
    const existingCourseFeeTotal = existingCourseFeeItems.reduce(
      (sum: number, item: any) => sum + item.amount, 0
    );

    // 3. Calculate combined total and apply 25% discount
    const combinedCourseFees = existingCourseFeeTotal + newClassPrice;
    const householdDiscount = combinedCourseFees * 0.25;
    const discountedTotal = combinedCourseFees - householdDiscount;
    
    // 4. Split 50/50
    const sharePerHandler = Math.round((discountedTotal / 2) * 100) / 100; // Round to 2 decimal places

    console.log("HOUSEHOLD-REBALANCE: Calculation", {
      existingCourseFeeTotal,
      newClassPrice,
      combinedCourseFees,
      householdDiscount,
      discountedTotal,
      sharePerHandler,
    });

    // 5. Update the existing invoice
    // We need to adjust the course fee items proportionally
    const existingRatio = existingCourseFeeTotal > 0 
      ? sharePerHandler / existingCourseFeeTotal 
      : 1;

    // Update each course fee item proportionally
    for (const item of existingCourseFeeItems) {
      const newAmount = Math.round(item.amount * existingRatio * 100) / 100;
      
      const { error: updateItemError } = await supabase
        .from('invoice_items')
        .update({
          amount: newAmount,
          unit_price: newAmount,
        })
        .eq('id', item.id);

      if (updateItemError) {
        console.error("HOUSEHOLD-REBALANCE: Error updating invoice item", updateItemError);
      }
    }

    // Recalculate the existing invoice's subtotal and total
    const { data: updatedItems } = await supabase
      .from('invoice_items')
      .select('amount')
      .eq('invoice_id', existingInvoiceId);

    const newSubtotal = updatedItems?.reduce((sum, item) => sum + item.amount, 0) || 0;

    const { error: updateInvoiceError } = await supabase
      .from('invoices')
      .update({
        subtotal: newSubtotal,
        total: newSubtotal, // No tax in this system
        discount_reason: `Household discount applied (50/50 split with ${newClassName})`,
      })
      .eq('id', existingInvoiceId);

    if (updateInvoiceError) {
      console.error("HOUSEHOLD-REBALANCE: Error updating existing invoice", updateInvoiceError);
    }

    // 6. Create new invoice for the second handler
    // Generate invoice number using the same approach as useInvoiceUtilities
    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Determine branch prefix
    const branchPrefix = newClassBranchId === '6351a9e8-77db-403b-ab1f-cd47e393a006' ? 'McD' : 'McR';
    const invoicePrefix = `INV-${branchPrefix}-${yearMonth}-`;
    
    // Get the LAST invoice number for this prefix (not count!)
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .ilike('invoice_number', `${invoicePrefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.length > 0) {
      const lastSequence = lastInvoice[0].invoice_number.split('-').pop();
      if (lastSequence) {
        nextNumber = parseInt(lastSequence, 10) + 1;
      }
    }

    const newInvoiceNumber = `${invoicePrefix}${nextNumber.toString().padStart(4, '0')}`;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create the new invoice
    const { data: newInvoice, error: createInvoiceError } = await supabase
      .from('invoices')
      .insert({
        client_id: newHandlerId,
        invoice_number: newInvoiceNumber,
        issued_date: now.toISOString(),
        due_date: dueDate.toISOString(),
        status: 'draft',
        subtotal: sharePerHandler + newEnrollmentFee,
        total: sharePerHandler + newEnrollmentFee,
        branch_id: newClassBranchId,
        discount_amount: 0,
        discount_type: 'fixed',
        discount_reason: `Household discount applied (50/50 split - original: R${newClassPrice})`,
        tax_rate: 0,
        tax_amount: 0,
      })
      .select()
      .single();

    if (createInvoiceError || !newInvoice) {
      console.error("HOUSEHOLD-REBALANCE: Error creating new invoice", createInvoiceError);
      return { success: false, error: "Failed to create new invoice for second handler" };
    }

    // Create invoice items for the new invoice
    const invoiceItems = [];

    // Course fee item (with household share)
    for (let i = 0; i < newDogIds.length; i++) {
      const dogShare = sharePerHandler / newDogIds.length;
      invoiceItems.push({
        invoice_id: newInvoice.id,
        booking_id: newBookingIds[i],
        description: `${newClassName} - ${newDogNames[i]} (Household 50/50 share)`,
        quantity: 1,
        unit_price: dogShare,
        amount: dogShare,
        item_type: 'course_fee',
      });
    }

    // Enrollment fee (if any) - not split, applies per dog
    if (newEnrollmentFee > 0) {
      invoiceItems.push({
        invoice_id: newInvoice.id,
        booking_id: newBookingIds[0],
        description: `Enrollment Fee - ${newDogNames[0]}`,
        quantity: 1,
        unit_price: newEnrollmentFee,
        amount: newEnrollmentFee,
        item_type: 'enrollment_fee',
      });
    }

    const { error: createItemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (createItemsError) {
      console.error("HOUSEHOLD-REBALANCE: Error creating invoice items", createItemsError);
    }

    // 7. Create admin notification task
    await supabase.from('handler_tasks').insert({
      handler_id: existingHandlerId,
      task_type: 'household_invoice_rebalanced',
      title: 'Household invoices rebalanced',
      description: `Household member enrolled in ${newClassName}. Invoice ${existingInvoice.invoice_number} was adjusted from R${existingCourseFeeTotal} to R${sharePerHandler}. New invoice ${newInvoiceNumber} created for R${sharePerHandler + newEnrollmentFee}. Total household discount: R${householdDiscount.toFixed(2)} (25%).`,
      status: 'pending',
    });

    console.log("HOUSEHOLD-REBALANCE: Success", {
      firstInvoiceNewTotal: sharePerHandler,
      secondInvoiceNewTotal: sharePerHandler + newEnrollmentFee,
      totalDiscount: householdDiscount,
    });

    return {
      success: true,
      firstInvoiceNewTotal: sharePerHandler,
      secondInvoiceNewTotal: sharePerHandler + newEnrollmentFee,
      totalDiscount: householdDiscount,
      firstInvoiceNumber: existingInvoice.invoice_number,
    };

  } catch (error: any) {
    console.error("HOUSEHOLD-REBALANCE: Unexpected error", error);
    return { success: false, error: error.message };
  }
}
