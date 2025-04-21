import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { InvoiceStatus } from "@/types/invoice";
import { UseMutationResult } from "@tanstack/react-query";

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
  enrollmentFee = 0
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    let invoiceNumber;
    try {
      invoiceNumber = await generateInvoiceNumber();
    } catch (error) {
      // fallback logic remains
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
        } else {
          const branchId = localStorage.getItem('currentBranchId');
          if (branchId) {
            const { data: branchData } = await supabase.from('branches').select('name').eq('id', branchId).maybeSingle();
            if (branchData?.name) {
              if (branchData.name.toLowerCase().includes('delta')) branchCode = "D";
              else if (branchData.name.toLowerCase().includes('randburg')) branchCode = "R";
              else branchCode = branchData.name.charAt(0).toUpperCase();
            }
          }
        }
      } catch {}
      invoiceNumber = `INV-Mc${branchCode}-${year}${month}-${timestamp.padStart(4, '0')}`;
    }

    // Validate uniqueness (rare collision)
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .maybeSingle();
    if (existingInvoice) {
      // If collision, append unique and log
      const uniqueSuffix = Math.floor(Math.random() * 9000 + 1000).toString();
      invoiceNumber = `${invoiceNumber}-${uniqueSuffix}`;
    }

    // ITEMS: Always Course Fee + Enrollment Fee combined as separate items
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

    // Prepare invoice data (let the createInvoice hook do calculation from items)
    const invoiceData = {
      client_id: handlerId,
      invoice_number: invoiceNumber,
      status: "draft" as InvoiceStatus,
      issued_date: new Date(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: `Invoice for ${className} training class for ${dogName}.`,
      tax_rate: 0,
      items,
      discount_type: "fixed",
      discount_amount: 0,
      discount_reason: ""
    };

    try {
      await createInvoice.mutateAsync(invoiceData);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
};
