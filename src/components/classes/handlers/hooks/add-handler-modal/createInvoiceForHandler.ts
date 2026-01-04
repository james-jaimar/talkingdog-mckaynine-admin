
import { UseMutationResult } from "@tanstack/react-query";
import { calculateInvoiceComponents } from "@/lib/calculateInvoiceComponents";
import { createInvoice } from "@/lib/invoices/createInvoiceUtils";

export interface CreateInvoiceProps {
  handlerId: string;
  dogId: string;
  bookingId: string;
  className: string;
  classPrice: number;
  dogName: string;
  generateInvoiceNumber: (referenceDate?: Date) => Promise<string>;
  createInvoice: UseMutationResult<any, Error, any, unknown>;
  currentBranch?: { id: string; name: string } | null;
  enrollmentFee?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
  classDate?: Date; // Use class schedule date for invoice instead of today
}

export const createInvoiceForHandler = async ({
  handlerId,
  dogId,
  bookingId,
  className,
  classPrice,
  dogName,
  generateInvoiceNumber,
  createInvoice: createInvoiceMutation,
  currentBranch,
  enrollmentFee = 0,
  discountType = "fixed",
  discountAmount = 0,
  classDate,
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    console.log("CREATE-INVOICE: Starting invoice creation with params:", {
      handlerId, dogId, bookingId, className, classPrice, enrollmentFee,
      discountType, discountAmount
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

    // Create invoice items
    const items = [
      {
        description: `${className} training class for ${dogName}`,
        quantity: 1,
        unit_price: classPrice,
        booking_id: bookingId,
      }
    ];
    
    if (enrollmentFee && enrollmentFee > 0) {
      items.push({
        description: `Enrollment fee for ${className}`,
        quantity: 1,
        unit_price: enrollmentFee,
        booking_id: bookingId,
      });
    }

    // Calculate invoice components using the canonical utility
    const breakdown = calculateInvoiceComponents({
      courseFee: classPrice,
      enrollmentFee,
      discount: discountAmount,
      discountType,
    });

    console.log("CREATE-INVOICE: Calculated breakdown:", breakdown);

    // Verify the subtotal
    if (breakdown.subtotal === 0) {
      console.error("CREATE-INVOICE: Subtotal is zero - check input arguments!", {
        classPrice, enrollmentFee, discountType, discountAmount
      });
    }

    // Use class date if provided (for backfilling), otherwise use today
    const invoiceDate = classDate || new Date();
    const dueDate = new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Create the invoice data object - removed fields that don't exist in the database
    const invoiceData = {
      client_id: handlerId,
      invoice_number: invoiceNumber,
      status: "draft",
      issued_date: invoiceDate,
      due_date: dueDate,
      notes: `Invoice for ${className} training class for ${dogName}.`,
      tax_rate: 0,
      items,
      discount_type: discountType,
      discount_amount: discountAmount,
      discount_reason: "",
      subtotal: breakdown.subtotal,
      total: breakdown.total,
      monetary_discount: breakdown.monetaryDiscount,
    };

    console.log("CREATE-INVOICE: About to create invoice with data:", invoiceData);

    try {
      // Use the mutation function to create the invoice through our centralized utility
      await createInvoiceMutation.mutateAsync(invoiceData);
      console.log("CREATE-INVOICE: Invoice created successfully");
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
