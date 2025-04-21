
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
  currentBranch,
  enrollmentFee = 0
}: CreateInvoiceProps): Promise<boolean> => {
  try {
    console.log("Creating invoice with branch context:", currentBranch?.name);
    console.log(`Class price: ${classPrice}, Enrollment fee: ${enrollmentFee}`);
    
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
    
    // Check if this invoice number already exists
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing invoice:", checkError);
    }
    
    if (existingInvoice) {
      console.warn("Invoice number already exists, generating a new unique number");
      // Append a random suffix to make unique, but in a predictable format
      const uniqueSuffix = Math.floor(Math.random() * 9000 + 1000).toString(); // 1000-9999
      invoiceNumber = `${invoiceNumber.split('-').slice(0, 3).join('-')}-${uniqueSuffix}`;
      console.log("Modified invoice number to avoid duplicate:", invoiceNumber);
    }
    
    // Create items array with separate course fee and enrollment fee
    const items = [];
    
    // Add course fee item
    items.push({
      description: `${className} training class for ${dogName}`,
      quantity: 1,
      unit_price: classPrice,
      booking_id: bookingId,
    });
    
    // Add enrollment fee item if it exists and is greater than 0
    if (enrollmentFee && enrollmentFee > 0) {
      items.push({
        description: `Enrollment fee for ${className}`,
        quantity: 1,
        unit_price: enrollmentFee,
        booking_id: bookingId,
      });
    }
    
    // Calculate total price correctly including both fees
    const totalAmount = classPrice + (enrollmentFee || 0);
    console.log(`Total invoice amount: ${totalAmount} (Course: ${classPrice} + Enrollment: ${enrollmentFee || 0})`);
    
    // Prepare invoice data
    const invoiceData = {
      client_id: handlerId,
      invoice_number: invoiceNumber,
      status: "draft" as InvoiceStatus,
      issued_date: new Date(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: `Invoice for ${className} training class for ${dogName}.`,
      tax_rate: 0, // Default tax rate set to 0%
      items: items,
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
