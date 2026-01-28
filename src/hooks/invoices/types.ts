
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
  branch_id: string; // Ensuring branch_id is required
}

// Define InvoiceStatus as a type for better type checking
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'invalid';

// IO Sync Status type
export type IOSyncStatus = 'pending' | 'synced' | 'failed' | 'payment_synced' | null;

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  issued_date: string;
  due_date: string;
  status: InvoiceStatus;
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
  
  // Add missing properties that are used in the components
  monetary_discount?: number;
  original_discount_amount?: number;
  original_discount_type?: string;
  discount_reason?: string;
  
  // Additional fields for financial analysis
  admin_fee?: number;
  trainer_fee?: number;
  franchise_fee?: number;
  email_sent?: boolean;
  
  // Franchise reporting allocation
  franchise_report_month?: string | null; // Format: 'YYYY-MM'
  
  // Branch attribution for multi-branch handlers
  branch_id?: string | null; // Branch where the class took place
  
  // InvoicesOnline (IO) sync fields
  io_sync_status?: IOSyncStatus;
  io_sync_error?: string | null;
  io_synced_at?: string | null;
  io_document_id?: string | null;
  io_invoice_number?: string | null;
  io_invoice_url?: string | null;
  io_payment_url?: string | null;
  io_client_id?: number | null;
  
  // Generated fields
  classInfo?: string;
  dogInfo?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id?: string; // Making this optional to match actual data structure
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  booking_id?: string;
  item_type?: string; // 'course_fee' or 'enrollment_fee'
  
  // Optional bookings field to support nested data
  bookings?: BookingWithDetails;
}

// Add the BookingWithDetails interface for invoice item enhancer
export interface BookingWithDetails {
  id: string;
  dogs?: {
    name: string;
    breed: string;
  };
  class_schedules?: {
    id: string;
    start_time: string;
    class_id: string;
    classes: {
      id: string;
      name: string;
      price?: number;
      description?: string;
    };
  };
}

// Add the InvoiceFormValues type for forms
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
    id?: string;
  }[];
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
}
