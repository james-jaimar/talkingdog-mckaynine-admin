
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Generates a sequential invoice number with year and month prefix
 * with multiple fallback mechanisms for resilience
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    // Get current date info for the prefix
    const now = new Date();
    const yearMonth = format(now, "yyyyMM");
    
    // Try to get the count of existing invoices for this month
    let count: number | null = null;
    
    try {
      const { data, error, count: resultCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .like('invoice_number', `INV-${yearMonth}-%`);
        
      if (error) {
        console.warn("Error checking existing invoices, using fallback method:", error);
        // Will use fallback below
      } else {
        count = resultCount;
      }
    } catch (err) {
      console.warn("Error checking existing invoices, using fallback method:", err);
      // Will use fallback below
    }
    
    // If we couldn't get the count (e.g., due to permissions), use a timestamp-based approach
    if (count === null) {
      // Use current timestamp milliseconds as part of the number to ensure uniqueness
      const timestamp = now.getTime();
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `INV-${yearMonth}-T${timestamp.toString().slice(-4)}${randomPart}`;
    }
    
    // Generate the sequential number (current count + 1)
    const sequentialNumber = String(count + 1).padStart(4, '0');
    
    // Format the invoice number as INV-YYYYMM-0001
    const invoiceNumber = `INV-${yearMonth}-${sequentialNumber}`;
    
    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    
    // Ultimate fallback - timestamp-based number with random component
    const now = new Date();
    const yearMonth = format(now, "yyyyMM");
    const timestamp = now.getTime();
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${yearMonth}-ERR${timestamp.toString().slice(-3)}${randomPart}`;
  }
};
