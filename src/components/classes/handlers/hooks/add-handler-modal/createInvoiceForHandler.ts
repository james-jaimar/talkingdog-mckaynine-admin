
import { supabase } from "@/integrations/supabase/client";
import { InvoiceStatus } from "@/types/invoice";
import { UseMutationResult } from "@tanstack/react-query";
import { calculateInvoiceComponents } from "@/lib/calculateInvoiceComponents";

export interface CreateInvoiceProps {
  handlerId: string;
  dogId: string;
  bookingId: string;
  className: string;
  classPrice: number;
  dogName: string;
  generateInvoiceNumber: () => Promise<string>;
  createInvoice: UseMutationResult<any, Error, any, unknown>;
  currentBranch?: { id: string; name: string } | null;
  enrollmentFee?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
  
  // Fee rates for percentage-based calculations
  adminFeeRate?: number;
  trainerFeeRate?: number;
  franchiseFeeRate?: number;
  
  // Complete fee information
  adminFeeType?: 'percentage' | 'amount';
  adminFeeValue?: number;
  trainerFeeType?: 'percentage' | 'amount';
  trainerFeeValue?: number;
  franchiseFeeType?: 'percentage' | 'amount';
  franchiseFeeValue?: number;
}

export const createInvoiceForHandler = async ({
  handlerId,
  dogId,
  bookingId,
  className,
  classPrice,
  dogName,
  generateInvoiceNumber,
  createInvoice,
  currentBranch,
  enrollmentFee = 0,
  discountType = "fixed",
  discountAmount = 0,
  adminFeeRate = 0,
  trainerFeeRate = 0,
  franchiseFeeRate = 0,
  adminFeeType = 'percentage',
  adminFeeValue = 0,
  trainerFeeType = 'percentage',
  trainerFeeValue = 0,
  franchiseFeeType = 'percentage',
  franchiseFeeValue = 0
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    console.log("CREATE-INVOICE: Starting invoice creation with params:", {
      handlerId, dogId, bookingId, className, classPrice, enrollmentFee,
      discountType, discountAmount, adminFeeRate, trainerFeeRate, franchiseFeeRate
    });

    // Generate invoice number with fallback
    let invoiceNumber: string;
    try {
      invoiceNumber = await generateInvoiceNumber();
    } catch (error) {
      console.error("Failed to generate invoice number, using fallback:", error);
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = now.getTime().toString().slice(-4);
      let branchCode = "X";
      
      if (currentBranch?.name) {
        if (currentBranch.name.toLowerCase().includes('delta')) branchCode = "D";
        else if (currentBranch.name.toLowerCase().includes('randburg')) branchCode = "R";
        else branchCode = currentBranch.name.charAt(0).toUpperCase();
      }
      
      invoiceNumber = `INV-Mc${branchCode}-${year}${month}-${timestamp.padStart(4, '0')}`;
    }

    // Check for invoice number uniqueness
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .maybeSingle();
      
    if (existingInvoice) {
      const uniqueSuffix = Math.floor(Math.random() * 9000 + 1000).toString();
      invoiceNumber = `${invoiceNumber}-${uniqueSuffix}`;
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
      adminFeeRate,
      trainerFeeRate,
      franchiseFeeRate,
    });

    console.log("CREATE-INVOICE: Calculated breakdown:", breakdown);

    // Verify the subtotal
    if (breakdown.subtotal === 0) {
      console.error("CREATE-INVOICE: Subtotal is zero - check input arguments!", {
        classPrice, enrollmentFee, discountType, discountAmount
      });
    }

    // Create the invoice data object
    const invoiceData = {
      client_id: handlerId,
      invoice_number: invoiceNumber,
      status: "draft" as InvoiceStatus,
      issued_date: new Date(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: `Invoice for ${className} training class for ${dogName}.`,
      tax_rate: 0,
      items,
      discount_type: discountType,
      discount_amount: discountAmount,
      discount_reason: "",
      subtotal: breakdown.subtotal,
      total: breakdown.total,
      monetary_discount: breakdown.monetaryDiscount,
      admin_fee: breakdown.adminFee,
      trainer_fee: breakdown.trainerFee,
      franchise_fee: breakdown.franchiseFee,
    };

    console.log("CREATE-INVOICE: About to create invoice with data:", invoiceData);

    // Create the invoice
    try {
      await createInvoice.mutateAsync(invoiceData);
      console.log("CREATE-INVOICE: Invoice created successfully");
      return true;
    } catch (error) {
      console.error("CREATE-INVOICE: Failed to create invoice with mutateAsync", error);
      
      // More detailed error logging for debugging
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        if ('cause' in error) {
          console.error("Error cause:", error.cause);
        }
      } else {
        console.error("Unknown error type:", typeof error);
      }
      
      return false;
    }
  } catch (error) {
    console.error("Error in createInvoiceForHandler OUTER catch:", error);
    return false;
  }
};
