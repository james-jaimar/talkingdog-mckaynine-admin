import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useBranch } from "@/context/BranchContext";

/**
 * Generates a sequential invoice number with branch code and month prefix
 * Format: INV-McD-2504-0001 for Delta branch in April 2025
 * Format: INV-McR-2504-0001 for Randburg branch in April 2025
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const yearMonth = `${year}${month}`;
    let branchPrefix = "Mc";
    let branchCode = "";

    try {
      const branchId = localStorage.getItem('currentBranchId');
      if (branchId) {
        const { data, error } = await supabase
          .from('branches')
          .select('name')
          .eq('id', branchId)
          .limit(1);

        if (!error && data && data.length > 0) {
          const branchName = data[0].name;
          if (branchName.toLowerCase().includes('delta')) branchCode = "D";
          else if (branchName.toLowerCase().includes('randburg')) branchCode = "R";
          else branchCode = branchName.charAt(0).toUpperCase();
        }
      }
      if (!branchCode) branchCode = "D"; // Default to Delta if no branch found
    } catch (err) {
      branchCode = "D"; // Default to Delta on error
    }

    const invoicePrefix = `INV-Mc${branchCode}-${yearMonth}-`;
    
    // Get the last invoice number for this prefix
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .ilike('invoice_number', `${invoicePrefix}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.length > 0) {
      const lastSequence = lastInvoice[0].invoice_number.split('-').pop();
      nextNumber = parseInt(lastSequence, 10) + 1;
    }

    return `${invoicePrefix}${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const yearMonth = `${year}${month}`;
    const timestamp = new Date().getTime().toString().slice(-4);
    return `INV-McD-${yearMonth}-${timestamp}`;
  }
};
