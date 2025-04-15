
import { useEmailInvoice } from "./useEmailInvoice";
import { useMarkInvoiceAsPaid, useMarkInvoiceAsSent, useCancelInvoice } from "./status";
import { useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "./mutations";
import { useInvoicesList, useInvoiceDetails, useClientInvoices, useMyInvoices } from "./queries";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { generateInvoiceNumber as generateInvoiceNumberUtil } from "../invoices/useInvoiceUtilities";

export function useInvoices() {
  const queryClient = useQueryClient();
  
  // Use the imported generateInvoiceNumber function
  const generateInvoiceNumber = generateInvoiceNumberUtil;

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
