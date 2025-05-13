
// Invoice type definitions
export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  booking_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceFormValues {
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: Date;
  due_date: Date;
  notes?: string;
  tax_rate: number;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    booking_id?: string | null;
  }[];
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
}
