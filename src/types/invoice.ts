
// Export all types from the invoice hooks directory
export * from '../hooks/invoices/types';

// Define InvoiceFormValues interface for use in components
export interface InvoiceFormValues {
  client_id: string;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issued_date: Date;
  due_date: Date;
  notes?: string;
  tax_rate: number;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    booking_id?: string | null;
    amount?: number;
  }>;
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
  subtotal?: number;
  total?: number;
  tax_amount?: number;
}
