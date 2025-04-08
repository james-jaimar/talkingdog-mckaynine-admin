
import { 
  useInvoicesList,
  useInvoiceDetails, 
  useClientInvoices, 
  useMyInvoices 
} from './invoices/useInvoiceQueries';

import { 
  useCreateInvoice, 
  useUpdateInvoice, 
  useDeleteInvoice 
} from './invoices/useInvoiceMutations';

import { 
  useMarkInvoiceAsPaid, 
  useMarkInvoiceAsSent, 
  useCancelInvoice,
  useEmailInvoice 
} from './invoices/useInvoiceStatus';

import { generateInvoiceNumber } from './invoices/useInvoiceUtilities';

export * from './invoices/types';

export function useInvoices() {
  const { data: invoices, isLoading } = useInvoicesList();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const markAsPaid = useMarkInvoiceAsPaid();
  const markAsSent = useMarkInvoiceAsSent();
  const cancelInvoice = useCancelInvoice();
  const emailInvoice = useEmailInvoice();

  return {
    invoices,
    isLoading,
    useInvoiceDetails,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    markAsSent,
    cancelInvoice,
    useClientInvoices,
    useMyInvoices,
    generateInvoiceNumber,
    emailInvoice
  };
}
