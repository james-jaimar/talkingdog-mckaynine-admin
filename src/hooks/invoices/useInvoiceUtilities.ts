
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Generates a sequential invoice number with year and month prefix
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    // Get current date info for the prefix
    const now = new Date();
    const yearMonth = format(now, "yyyyMM");
    
    // Get the count of existing invoices for this month to determine the sequence
    const { count, error } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .like('invoice_number', `INV-${yearMonth}-%`);
      
    if (error) {
      console.error("Error checking existing invoices:", error);
      throw error;
    }
    
    // Generate the sequential number (current count + 1)
    const sequentialNumber = String(count !== null ? count + 1 : 1).padStart(4, '0');
    
    // Format the invoice number as INV-YYYYMM-0001
    const invoiceNumber = `INV-${yearMonth}-${sequentialNumber}`;
    
    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    throw error;
  }
};
