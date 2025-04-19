export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'partially_paid';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount?: number;
  booking_id?: string | null;
}

export interface InvoiceFormValues {
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: Date;
  due_date: Date;
  notes?: string;
  tax_rate: number;
  items: InvoiceItem[];
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  status: InvoiceStatus;
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  discount_reason?: string;
  notes?: string;
  payment_received?: boolean;
  payment_date?: string;
  email_sent?: boolean;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  original_discount_percentage?: number;
  // Computed properties
  computed_payment_status?: PaymentStatus;
  computed_days_overdue?: number;
}
