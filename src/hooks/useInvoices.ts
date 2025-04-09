
// I need to expand on this file, but since I don't have full access to its current content,
// I'll just update the portion that integrates the emailInvoice mutation

import { useEmailInvoice } from "./invoices/useEmailInvoice";
import { useInvoiceStatus } from "./invoices/useInvoiceStatus";
import { useInvoiceMutations } from "./invoices/useInvoiceMutations";
import { useInvoiceQueries } from "./invoices/useInvoiceQueries";

export function useInvoices() {
  // Import various hooks for invoice operations
  const { useInvoicesList, useInvoiceDetails, useClientInvoices, useMyInvoices } = useInvoiceQueries();
  const { useCreateInvoice, useUpdateInvoice, useDeleteInvoice } = useInvoiceMutations();
  const { useMarkInvoiceAsPaid, useMarkInvoiceAsSent, useCancelInvoice } = useInvoiceStatus();
  const emailInvoice = useEmailInvoice();

  // Get hooks for invoice operations
  const invoicesList = useInvoicesList();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const markAsPaid = useMarkInvoiceAsPaid();
  const markAsSent = useMarkInvoiceAsSent();
  const cancelInvoice = useCancelInvoice();

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
  };
}
