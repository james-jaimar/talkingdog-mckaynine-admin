
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
  adminFeeRate?: number;      // e.g., 0.05 for 5%
  trainerFeeRate?: number;    // e.g., 0.25 for 25%
  franchiseFeeRate?: number;  // e.g., 0.1 for 10%
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
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    let invoiceNumber: string | undefined;
    try {
      invoiceNumber = await generateInvoiceNumber();
    } catch (error) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = now.getTime().toString().slice(-4);
      let branchCode = "X";
      try {
        if (currentBranch?.name) {
          if (currentBranch.name.toLowerCase().includes('delta')) branchCode = "D";
          else if (currentBranch.name.toLowerCase().includes('randburg')) branchCode = "R";
          else branchCode = currentBranch.name.charAt(0).toUpperCase();
        }
      } catch {}
      invoiceNumber = `INV-Mc${branchCode}-${year}${month}-${timestamp.padStart(4, '0')}`;
    }

    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .maybeSingle();
    if (existingInvoice) {
      const uniqueSuffix = Math.floor(Math.random() * 9000 + 1000).toString();
      invoiceNumber = `${invoiceNumber}-${uniqueSuffix}`;
    }

    // Check that we have valid pricing inputs
    if (typeof classPrice !== 'number' || isNaN(classPrice)) {
      console.error("CREATE-INVOICE: Invalid classPrice:", classPrice);
      classPrice = 0;
    }
    
    if (typeof enrollmentFee !== 'number' || isNaN(enrollmentFee)) {
      console.error("CREATE-INVOICE: Invalid enrollmentFee:", enrollmentFee);
      enrollmentFee = 0;
    }

    // Compose items
    const items = [
      {
        description: `${className} training class for ${dogName}`,
        quantity: 1,
        unit_price: classPrice,
        booking_id: bookingId,
      }
    ];
    
    if (enrollmentFee > 0) {
      items.push({
        description: `Enrollment fee for ${className}`,
        quantity: 1,
        unit_price: enrollmentFee,
        booking_id: bookingId,
      });
    }

    // Calculate amounts using the canonical utility
    const breakdown = calculateInvoiceComponents({
      courseFee: classPrice,
      enrollmentFee,
      discount: discountAmount,
      discountType,
      adminFeeRate,
      trainerFeeRate,
      franchiseFeeRate,
    });

    console.log("CREATE-INVOICE: Invoice calculation breakdown", {
      courseFee: classPrice, 
      enrollmentFee, 
      discountType, 
      discountAmount,
      adminFeeRate, 
      trainerFeeRate, 
      franchiseFeeRate, 
      breakdown
    });

    if (breakdown.subtotal === 0) {
      console.error("CREATE-INVOICE: Subtotal is zero - check input arguments!", {
        classPrice, enrollmentFee
      });
    }

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

    try {
      await createInvoice.mutateAsync(invoiceData);
      return true;
    } catch (error) {
      console.error("CREATE-INVOICE: Failed to create invoice with mutateAsync", error, invoiceData);
      return false;
    }
  } catch (error) {
    console.error("Error in createInvoiceForHandler OUTER catch:", error);
    return false;
  }
};
