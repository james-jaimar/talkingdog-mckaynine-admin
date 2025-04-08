
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useBranch } from "@/context/BranchContext";

/**
 * Generates a sequential invoice number with branch code and month prefix
 * with multiple fallback mechanisms for resilience
 * Format: McDAPR0001 for Delta branch, McRAPR0001 for Randburg branch
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    // Get current date info for the prefix
    const now = new Date();
    const monthAbbreviation = format(now, "MMM").toUpperCase();
    
    // Get branch information to determine the prefix
    let branchPrefix = "Mc"; // Default prefix if we can't determine branch
    let branchName = "";
    
    try {
      // Try to get the current branch from localStorage first (most reliable)
      const branchId = localStorage.getItem('currentBranchId');
      
      if (branchId) {
        // Fetch the branch name from Supabase using a simple query
        const { data, error } = await supabase
          .from('branches')
          .select('name')
          .eq('id', branchId)
          .single();
          
        if (!error && data) {
          branchName = data.name.toLowerCase();
          console.log("Invoice: Using branch from localStorage:", data.name);
          
          if (branchName.includes('delta')) {
            branchPrefix = "McD";
          } else if (branchName.includes('randburg')) {
            branchPrefix = "McR";
          }
        }
      }
      
      // If we couldn't get from localStorage, try querying directly
      if (!branchName) {
        // Get auth user first
        const { data: authData } = await supabase.auth.getUser();
        
        if (authData?.user) {
          // Get default branch with a simple query
          const { data: defaultBranch } = await supabase
            .from('branches')
            .select('name')
            .eq('is_default', true)
            .single();
            
          if (defaultBranch?.name) {
            branchName = defaultBranch.name.toLowerCase();
            console.log("Invoice: Using default branch:", defaultBranch.name);
            
            if (branchName.includes('delta')) {
              branchPrefix = "McD";
            } else if (branchName.includes('randburg')) {
              branchPrefix = "McR";
            }
          }
        }
      }
      
      console.log("Invoice: Using branch prefix:", branchPrefix);
    } catch (err) {
      console.warn("Error fetching branch info, using default prefix:", err);
      // Will use default prefix defined above
    }
    
    // Generate the prefix for the invoice number
    const invoicePrefix = `${branchPrefix}${monthAbbreviation}`;
    
    // Try to count matching invoices with the same prefix
    let count = 0;
    
    try {
      console.log("Querying invoices with prefix:", invoicePrefix);
      
      // Use a minimal select to avoid TypeScript complexity
      const { data } = await supabase
        .from('invoices')
        .select('invoice_number');
      
      // Filter matching invoices on the client side
      if (data && Array.isArray(data)) {
        const matchingInvoices = data.filter(invoice => 
          invoice.invoice_number && 
          typeof invoice.invoice_number === 'string' && 
          invoice.invoice_number.startsWith(invoicePrefix)
        );
        count = matchingInvoices.length;
        console.log(`Found ${count} invoices with prefix ${invoicePrefix}`);
      }
    } catch (err) {
      console.error("Error counting invoices:", err);
      
      // Simple fallback: get a total count instead
      try {
        const { count: totalCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true });
          
        if (totalCount !== null) {
          // Cap at a reasonable number to be safe
          count = Math.min(totalCount, 25);
          console.log(`Using total invoice count as fallback: ${count}`);
        } else {
          // Final fallback: use a small random number
          count = Math.floor(Math.random() * 10) + 1;
          console.log(`Using random count as fallback: ${count}`);
        }
      } catch (fallbackErr) {
        console.error("Even fallback query failed:", fallbackErr);
        count = Math.floor(Math.random() * 5) + 1;
      }
    }
    
    // Generate the sequential number (current count + 1)
    const sequentialNumber = String(count + 1).padStart(4, '0');
    
    // Format the invoice number as McDAPR0001 or McRAPR0001
    const invoiceNumber = `${branchPrefix}${monthAbbreviation}${sequentialNumber}`;
    
    console.log("Generated invoice number:", invoiceNumber);
    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    
    // Ultimate fallback - timestamp-based number with random component
    const now = new Date();
    const monthAbbreviation = format(now, "MMM").toUpperCase();
    const timestamp = now.getTime();
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `Mc${monthAbbreviation}ERR${timestamp.toString().slice(-3)}${randomPart}`;
  }
};
