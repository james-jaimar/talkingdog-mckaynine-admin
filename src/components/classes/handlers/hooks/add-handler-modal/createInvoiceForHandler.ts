
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
}

// Create an invoice for the handler based on the class details
export const createInvoiceForHandler = async ({
  handlerId,
  dogId,
  bookingId,
  className,
  classPrice,
  dogName,
  generateInvoiceNumber,
  createInvoice,
  currentBranch
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    console.log("Creating invoice with branch context:", currentBranch?.name);
    
    // Generate invoice number, with improved fallback handling
    let invoiceNumber;
    try {
      invoiceNumber = await generateInvoiceNumber();
    } catch (error) {
      console.error("Error generating invoice number, using simple fallback:", error);
      
      // Create a fallback invoice number based on the format
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = now.getTime().toString().slice(-4);
      
      // Get branch info for prefix if possible
      let branchCode = "X"; // Default fallback branch code
      try {
        if (currentBranch?.name) {
          if (currentBranch.name.toLowerCase().includes('delta')) {
            branchCode = "D";
            console.log("Using Delta branch code in fallback");
          } else if (currentBranch.name.toLowerCase().includes('randburg')) {
            branchCode = "R";
            console.log("Using Randburg branch code in fallback");
          } else {
            // Just use the first letter of branch name
            branchCode = currentBranch.name.charAt(0).toUpperCase();
          }
        } else {
          // If no current branch context is available, try to get from localStorage
          const branchId = localStorage.getItem('currentBranchId');
          if (branchId) {
            const { data: branchData } = await supabase
              .from('branches')
              .select('name')
              .eq('id', branchId)
              .maybeSingle();
              
            if (branchData?.name) {
              if (branchData.name.toLowerCase().includes('delta')) {
                branchCode = "D";
              } else if (branchData.name.toLowerCase().includes('randburg')) {
                branchCode = "R";
              } else {
                branchCode = branchData.name.charAt(0).toUpperCase();
              }
              console.log("Using branch from localStorage in fallback:", branchData.name);
            }
          }
        }
      } catch (err) {
        console.warn("Could not get branch info for invoice number fallback");
      }
      
      // Format: INV-McR-2504-0001 or INV-McD-2504-0001
      invoiceNumber = `INV-Mc${branchCode}-${year}${month}-${timestamp.padStart(4, '0')}`;
    }
    
    console.log("Generated invoice number:", invoiceNumber);
    
    // Prepare invoice data
    const invoiceData = {
      client_id: handlerId,
      invoice_number: invoiceNumber,
      status: "draft" as InvoiceStatus,
      issued_date: new Date(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: `Invoice for ${className} training class for ${dogName}.`,
      tax_rate: 0, // Default tax rate set to 0%
      items: [{
        description: `${className} training class for ${dogName}`,
        quantity: 1,
        unit_price: classPrice,
        booking_id: bookingId,
      }],
    };
    
    // Create the invoice through the mutation
    try {
      await createInvoice.mutateAsync(invoiceData);
      console.log("Invoice created successfully for handler:", handlerId);
      return true;
    } catch (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      return false;
    }
  } catch (error) {
    console.error("Error in invoice creation process:", error);
    return false;
  }
};
