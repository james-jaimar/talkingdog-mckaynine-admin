
import { useEmailInvoice } from "./invoices/useEmailInvoice";
import { useMarkInvoiceAsPaid, useMarkInvoiceAsSent, useCancelInvoice } from "./invoices/status";
import { useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "./invoices/mutations";
import { useInvoicesList, useInvoiceDetails, useClientInvoices, useMyInvoices } from "./invoices/useInvoiceQueries";
import { useQueryClient } from "@tanstack/react-query";
import { generateInvoiceNumber as generateInvoiceNumberUtil } from "./invoices/useInvoiceUtilities";
import { toast } from "sonner";

// Re-export the individual hook functions for direct imports
export { 
  useMarkInvoiceAsPaid, 
  useMarkInvoiceAsSent, 
  useCancelInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useEmailInvoice,
  useInvoicesList,
  useInvoiceDetails,
  useClientInvoices,
  useMyInvoices
};

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
  
  // Function to refresh all related invoice queries with error handling
  const refreshAllInvoiceQueries = async () => {
    console.log("Refreshing all invoice queries");
    try {
      // First invalidate all queries to clear stale data
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      
      // Reset queries to clear cache completely
      await queryClient.resetQueries({ queryKey: ['invoices'] });
      await queryClient.resetQueries({ queryKey: ['financial-bookings'] });
      
      // Force refetch invoices list to ensure data is fresh
      await invoicesList.refetch();
      
      // Force refetch all active financial queries
      await queryClient.refetchQueries({ 
        queryKey: ['financial-bookings'],
        type: 'all'
      });
    } catch (error) {
      console.error("Error refreshing invoice queries:", error);
      toast.error("Failed to refresh invoice data");
      throw error;
    }
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
    error: invoicesList.error,
    
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
