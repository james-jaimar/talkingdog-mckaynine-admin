
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
        // Fetch the branch name from Supabase
        const { data: branchData, error } = await supabase
          .from('branches')
          .select('name')
          .eq('id', branchId)
          .maybeSingle();
          
        if (!error && branchData) {
          branchName = branchData.name.toLowerCase();
          console.log("Invoice: Using branch from localStorage:", branchData.name);
          
          if (branchName.includes('delta')) {
            branchPrefix = "McD";
          } else if (branchName.includes('randburg')) {
            branchPrefix = "McR";
          }
        }
      }
      
      // If we couldn't get from localStorage, try querying directly
      if (!branchName) {
        const { data: userProfiles } = await supabase.auth.getUser();
        
        if (userProfiles?.user) {
          // Fixed: Use maybeSingle instead of single to avoid potential errors
          const { data: defaultBranch } = await supabase
            .from('branches')
            .select('name')
            .eq('is_default', true)
            .maybeSingle();
            
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
    
    // Try to get the count of existing invoices for this month and branch
    let count: number | null = null;
    
    try {
      // Fixed: Further simplified query structure to avoid TypeScript recursive type issues
      const invoicePrefix = `${branchPrefix}${monthAbbreviation}`;
      const { data, error } = await supabase
        .from('invoices')
        .select('id', { count: 'exact' })
        .ilike('invoice_number', `${invoicePrefix}%`);
      
      if (error) {
        console.warn("Error checking existing invoices, using fallback method:", error);
        // Will use fallback below
      } else {
        // Count the returned items
        count = data?.length || 0;
        console.log(`Invoice: Found ${count} existing invoices with prefix ${branchPrefix}${monthAbbreviation}`);
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
      return `${branchPrefix}${monthAbbreviation}T${timestamp.toString().slice(-4)}${randomPart}`;
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
