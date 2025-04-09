
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useBranch } from "@/context/BranchContext";

/**
 * Generates a sequential invoice number with branch code and month prefix
 * Format: INV-McD-2504-0001 for Delta branch in April 2025
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    // Get current date info for the prefix
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Get last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month as 2 digits
    const yearMonth = `${year}${month}`; // Combined as YYMM format
    
    // Get branch information to determine the prefix
    let branchPrefix = "Mc"; // Default prefix if we can't determine branch
    let branchCode = ""; // First letter of branch name
    
    try {
      // Try to get the current branch from localStorage first (most reliable)
      const branchId = localStorage.getItem('currentBranchId');
      
      if (branchId) {
        // Use query with explicit return type
        const { data, error } = await supabase
          .from('branches')
          .select('name')
          .eq('id', branchId)
          .limit(1);
          
        if (!error && data && data.length > 0) {
          const branchName = data[0].name;
          console.log("Invoice: Using branch from localStorage:", branchName);
          
          // Get first letter of branch name
          if (branchName && branchName.length > 0) {
            branchCode = branchName.charAt(0).toUpperCase();
          }
          
          // Use the first letter for branch code
          if (branchName.toLowerCase().includes('delta')) {
            branchCode = "D";
          } else if (branchName.toLowerCase().includes('randburg')) {
            branchCode = "R";
          }
        }
      }
      
      // If we couldn't get from localStorage, try querying directly
      if (!branchCode) {
        // Get auth user first
        const { data: authData } = await supabase.auth.getUser();
        
        if (authData?.user) {
          // Use the RPC function for getting the default branch name
          const { data: branchData, error: branchError } = await supabase
            .rpc('get_default_branch_name');
            
          if (!branchError && branchData) {
            const branchName = String(branchData);
            console.log("Invoice: Using default branch:", branchName);
            
            // Get first letter of branch name
            if (branchName && branchName.length > 0) {
              branchCode = branchName.charAt(0).toUpperCase();
            }
            
            // Special handling for known branches
            if (branchName.toLowerCase().includes('delta')) {
              branchCode = "D";
            } else if (branchName.toLowerCase().includes('randburg')) {
              branchCode = "R";
            }
          }
        }
      }
      
      // If we still don't have a branch code, use X as fallback
      if (!branchCode) {
        branchCode = "X";
      }
      
      console.log("Invoice: Using branch code:", branchCode);
    } catch (err) {
      console.warn("Error fetching branch info, using default branch code:", err);
      branchCode = "X"; // Fallback branch code
    }
    
    // Generate the prefix for the invoice number
    // Format: INV-McD-2504-####
    const invoicePrefix = `INV-Mc${branchCode}-${yearMonth}-`;
    
    // Try to count matching invoices with the same prefix
    let count = 0;
    
    try {
      console.log("Querying invoices with prefix:", invoicePrefix);
      
      // Use RPC function or direct query to count invoices with prefix
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .ilike('invoice_number', `${invoicePrefix}%`);
      
      if (!error && invoices) {
        count = invoices.length;
        console.log(`Found ${count} invoices with prefix ${invoicePrefix}`);
      }
    } catch (err) {
      console.error("Error counting invoices:", err);
      
      // Simple fallback: get a total count instead
      try {
        // Simple count without filtering
        const { count: totalCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true });
          
        if (totalCount !== null) {
          // Cap at a reasonable number to be safe
          count = Math.min(totalCount % 100, 25);
          console.log(`Using modulo of total invoice count as fallback: ${count}`);
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
    
    // Format the invoice number as INV-McD-2504-0001
    const invoiceNumber = `${invoicePrefix}${sequentialNumber}`;
    
    console.log("Generated invoice number:", invoiceNumber);
    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    
    // Ultimate fallback - timestamp-based number with random component
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(3, '0');
    return `INV-McX-${year}${month}-ERR${randomPart}`;
  }
};
