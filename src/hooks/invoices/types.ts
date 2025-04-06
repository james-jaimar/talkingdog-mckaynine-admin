
import { Tables } from "@/integrations/supabase/types";

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  email_sent: boolean | null;
  payment_received: boolean | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
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
  booking_id: string | null;
  created_at: string;
  updated_at: string;
  booking?: {
    id: string;
    dog_id: string;
    dog_name?: string;
    class_name?: string;
    class_date?: string;
  };
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceFormValues {
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: Date;
  due_date: Date;
  notes: string;
  items: {
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    booking_id?: string | null;
  }[];
  tax_rate: number;
}

export interface ClientInvoiceSummary {
  total_invoices: number;
  total_paid: number;
  total_outstanding: number;
  recent_invoices: Invoice[];
}
