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
      if (!branchCode) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: branchData, error: branchError } = await supabase.rpc('get_default_branch_name');
          if (!branchError && branchData) {
            const branchName = String(branchData);
            if (branchName.toLowerCase().includes('delta')) branchCode = "D";
            else if (branchName.toLowerCase().includes('randburg')) branchCode = "R";
            else branchCode = branchName.charAt(0).toUpperCase();
          }
        }
      }
      if (!branchCode) branchCode = "X";
    } catch (err) {
      branchCode = "X";
    }

    const invoicePrefix = `INV-Mc${branchCode}-${yearMonth}-`;
    let nextSequentialNumber = 1;
    let candidateInvoiceNumber = "";

    try {
      // Always try to use the RPC first
      const { data: count, error: countError } = await supabase.rpc('count_invoices_with_prefix', { prefix: invoicePrefix });
      if (!countError && count !== null) {
        nextSequentialNumber = count + 1;
      } else {
        // fallback - manual count in case RPC fails
        const { data: invoices, error: queryError } = await supabase
          .from('invoices')
          .select('invoice_number')
          .ilike('invoice_number', `${invoicePrefix}%`);
        if (!queryError && invoices) {
          nextSequentialNumber = invoices.length + 1;
        }
      }
      const sequentialNumber = String(nextSequentialNumber).padStart(4, '0');
      candidateInvoiceNumber = `${invoicePrefix}${sequentialNumber}`;

      // Check for collision and add suffix *only* if really needed
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('invoice_number', candidateInvoiceNumber)
        .maybeSingle();

      if (!existingInvoice) {
        return candidateInvoiceNumber;
      } else {
        // If by tiny chance there is a real collision, append a unique 4-digit suffix
        const uniqueSuffix = Math.floor(Math.random()*9000 + 1000).toString();
        return `${invoicePrefix}${sequentialNumber}-${uniqueSuffix}`;
      }
    } catch (error) {
      // Fallback - timestamp
      const timestamp = now.getTime().toString().slice(-4);
      return `INV-Mc${branchCode}-${yearMonth}-${timestamp}`;
    }
  } catch (error) {
    // Ultimate fallback again if something majorly breaks
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `INV-McX-${year}${month}-${timestamp}`;
  }
};
