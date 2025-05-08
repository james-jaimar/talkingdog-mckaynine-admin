
// Add or update the Client interface to include branch_id
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  branch_id: string; // Adding branch_id property
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  issued_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'invalid';
  total: number;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  notes?: string;
  payment_received?: boolean;
  payment_date?: string;
  client?: Client; // Using the Client interface
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  booking_id?: string;
}
