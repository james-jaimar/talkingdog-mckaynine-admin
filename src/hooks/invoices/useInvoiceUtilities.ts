
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
          
          // Use explicit branch code for known branches
          if (branchName.toLowerCase().includes('delta')) {
            branchCode = "D";
            console.log("Using Delta branch code");
          } else if (branchName.toLowerCase().includes('randburg')) {
            branchCode = "R";
            console.log("Using Randburg branch code");
          } else {
            // Get first letter of branch name for other branches
            branchCode = branchName.charAt(0).toUpperCase();
            console.log("Using first letter branch code:", branchCode);
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
            
            // Explicit handling for known branches
            if (branchName.toLowerCase().includes('delta')) {
              branchCode = "D";
              console.log("Using Delta branch code from default");
            } else if (branchName.toLowerCase().includes('randburg')) {
              branchCode = "R";
              console.log("Using Randburg branch code from default");
            } else {
              // Get first letter of branch name
              branchCode = branchName.charAt(0).toUpperCase();
              console.log("Using first letter branch code from default:", branchCode);
            }
          }
        }
      }
      
      // If we still don't have a branch code, use X as fallback
      if (!branchCode) {
        branchCode = "X";
        console.log("Using fallback branch code X");
      }
    } catch (err) {
      console.warn("Error fetching branch info, using default branch code:", err);
      branchCode = "X"; // Fallback branch code
    }
    
    // Generate the prefix for the invoice number
    // Format: INV-McD-2504-#### for Delta
    // Format: INV-McR-2504-#### for Randburg
    const invoicePrefix = `INV-Mc${branchCode}-${yearMonth}-`;
    
    // Get count of invoices with the same prefix
    let nextSequentialNumber = 1;
    
    try {
      console.log("Querying invoices with prefix:", invoicePrefix);
      
      // Use built-in RPC function for counting invoices with prefix
      const { data: count, error: countError } = await supabase
        .rpc('count_invoices_with_prefix', { prefix: invoicePrefix });
      
      if (!countError && count !== null) {
        nextSequentialNumber = count + 1;
        console.log(`Found ${count} existing invoices with prefix ${invoicePrefix}`);
      } else {
        // Fallback: direct query to count invoices
        const { data: invoices, error: queryError } = await supabase
          .from('invoices')
          .select('invoice_number')
          .ilike('invoice_number', `${invoicePrefix}%`);
        
        if (!queryError && invoices) {
          nextSequentialNumber = invoices.length + 1;
          console.log(`Direct query found ${invoices.length} invoices with prefix ${invoicePrefix}`);
        }
      }
    } catch (err) {
      console.error("Error counting invoices:", err);
      nextSequentialNumber = 1; // Default to 1 if we can't count
    }
    
    // Format the sequential number with leading zeros
    const sequentialNumber = String(nextSequentialNumber).padStart(4, '0');
    
    // Format the final invoice number
    const invoiceNumber = `${invoicePrefix}${sequentialNumber}`;
    
    console.log("Generated invoice number:", invoiceNumber);
    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    
    // Ultimate fallback - timestamp-based number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `INV-McX-${year}${month}-${timestamp}`;
  }
};
