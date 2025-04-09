
import { useEmailInvoice } from "./useEmailInvoice";
import { useMarkInvoiceAsPaid, useMarkInvoiceAsSent, useCancelInvoice } from "./status";
import { useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "./mutations";
import { useInvoicesList, useInvoiceDetails, useClientInvoices, useMyInvoices } from "./queries";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function useInvoices() {
  const queryClient = useQueryClient();
  
  // Generate invoice number function
  const generateInvoiceNumber = async () => {
    try {
      // Fetch the latest invoice to determine the next invoice number
      const { data: latestInvoice, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
        console.error("Error fetching latest invoice:", error);
        throw error;
      }

      // Current date elements for the invoice number prefix
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Base prefix for the invoice number
      const prefix = `INV-${year}${month}-`;
      
      if (!latestInvoice) {
        // If no invoices exist, start with INV-YYMM-0001
        return `${prefix}0001`;
      }
      
      // Extract the numeric portion if it follows our format
      const latestNumber = latestInvoice.invoice_number;
      
      // If it follows our expected format with a number at the end
      if (latestNumber && latestNumber.startsWith(`INV-${year}${month}-`)) {
        const numericPart = latestNumber.substring(prefix.length);
        if (/^\d+$/.test(numericPart)) {
          // Increment and pad to 4 digits
          const nextNumber = (parseInt(numericPart, 10) + 1).toString().padStart(4, '0');
          return `${prefix}${nextNumber}`;
        }
      }
      
      // If we couldn't parse the existing format, start a new sequence for this month
      return `${prefix}0001`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      throw error;
    }
  };

  // Import various hooks for invoice operations
  const invoicesList = useInvoicesList();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const markAsPaid = useMarkInvoiceAsPaid();
  const markAsSent = useMarkInvoiceAsSent();
  const cancelInvoice = useCancelInvoice();
  const emailInvoice = useEmailInvoice();
  
  // Function to refresh all related invoice queries
  const refreshAllInvoiceQueries = () => {
    console.log("Refreshing all invoice queries");
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
    // Force refetch the invoices list
    invoicesList.refetch();
  };

  return {
    // Query hooks
    useInvoicesList,
    useInvoiceDetails,
    useClientInvoices,
    useMyInvoices,
    
    // Mutation hooks
    useCreateInvoice,
    useUpdateInvoice, 
    useDeleteInvoice,
    
    // Data from hooks
    invoices: invoicesList.data || [],
    isLoading: invoicesList.isLoading,
    
    // Mutations
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    markAsSent,
    cancelInvoice,
    emailInvoice,
    
    // Utilities
    generateInvoiceNumber,
    refreshAllInvoiceQueries,
  };
}
