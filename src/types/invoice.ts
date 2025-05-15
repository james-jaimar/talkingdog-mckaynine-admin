
// Export all types from the invoice hooks directory
export * from '../hooks/invoices/types';

// Additional types for dashboard components
export interface BookingWithInvoiceData {
  id: string;
  status: string;
  payment_status: string;
  computed_payment_status?: string;
  created_at: string;
  clients: {
    first_name: string;
    last_name: string;
    branch_id: string;
  };
  dogs?: {
    name: string;
  };
  class_schedules: {
    start_time: string;
    term_id?: string;
    classes: {
      name: string;
    };
  };
  invoice_items?: Array<{
    invoice_id: string;
    invoices?: {
      id: string;
      status: string;
      payment_received?: boolean;
    };
  }>;
}
