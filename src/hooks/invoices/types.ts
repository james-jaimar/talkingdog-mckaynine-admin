
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount?: number;
  booking_id?: string | null;
  // Add the bookings property with its nested structure
  bookings?: {
    id: string;
    dog_id?: string;
    class_schedule_id?: string;
    dogs?: {
      name: string;
      breed: string;
    };
    class_schedules?: {
      id: string;
      start_time: string;
      classes?: {
        id: string;
        name: string;
        description: string;
        price: number;
      }
    }
  };
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
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string;
  payment_date?: string | null;
  payment_received: boolean;
  email_sent: boolean;
  notes?: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  items?: InvoiceItem[];
}
