
import { UseMutationResult } from "@tanstack/react-query";
import { calculateInvoiceComponents } from "@/lib/calculateInvoiceComponents";
import { createInvoice } from "@/lib/invoices/createInvoiceUtils";

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
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    console.log("CREATE-INVOICE: Starting invoice creation with params:", {
      handlerId, dogIds, bookingIds, className, classPrice, enrollmentFee, dogNames
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
    }> = [];

    let subtotal = 0;
    let totalDiscount = 0;

    dogIds.forEach((dogId, index) => {
      const dogName = dogNames[index] || `Dog ${index + 1}`;
      const bookingId = bookingIds[index];
      const isSecondDog = index === 1;
      
      // Calculate price for this dog
      let dogClassPrice = classPrice;
      let discountNote = "";
      
      if (isSecondDog) {
        // Apply 25% discount to 2nd dog's course fee
        const discountAmount = Math.round(classPrice * MULTI_DOG_DISCOUNT_PERCENT / 100);
        dogClassPrice = classPrice - discountAmount;
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
