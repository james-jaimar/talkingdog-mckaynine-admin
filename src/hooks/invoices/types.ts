
// Types for invoice entities

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue' | 'invalid';

export interface InvoiceItem {
  id: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  booking_id?: string | null;
  bookings?: {
    id: string;
    dogs: {
      name: string;
      breed?: string;
    };
    class_schedules: {
      id: string;
      start_time: string;
      class_id: string;
      classes: {
        id: string;
        name: string;
        price: number;
        description: string;
        admin_fee_type?: string;
        admin_fee_value?: number;
        trainer_fee_type?: string;
        trainer_fee_value?: number;
        mckaynine_commission_type?: string;
        mckaynine_commission_value?: number;
      };
    };
  };
  created_at?: string;
  updated_at?: string;
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
    address?: string;
    city?: string;
    postal_code?: string;
  };
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
  total: number;
  status: InvoiceStatus;
  payment_received?: boolean;
  payment_date?: string;
  notes?: string;
  items?: InvoiceItem[];
  classInfo?: string | null;
  dogInfo?: string | null;
  admin_fee?: number;
  trainer_fee?: number;
  franchise_fee?: number;
  created_at?: string;
  updated_at?: string;
  
  // Additional fields that were missing
  original_discount_amount?: number;
  original_discount_type?: 'fixed' | 'percentage';
  monetary_discount?: number;
  email_sent?: boolean;
}

export interface InvoiceFormData {
  client_id: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    booking_id?: string;
  }[];
  subtotal: number;
  tax_rate: number;
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
  notes?: string;
  due_date: string;
}

// Add the InvoiceFormValues interface needed by components
export interface InvoiceFormValues {
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issued_date: Date;
  due_date: Date;
  notes?: string;
  tax_rate: number;
  items: {
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    booking_id?: string | null;
  }[];
  discount_type: 'fixed' | 'percentage';
  discount_amount: number;
  discount_reason?: string;
}

export interface InvoiceResponse {
  id: string;
  invoice_number: string;
  status: string;
  [key: string]: any;
}

// Type for invoice item with booking details
export interface InvoiceItemWithDetails extends InvoiceItem {
  booking_details?: {
    id: string;
    dog: {
      name: string;
      breed?: string;
    };
    class_schedule: {
      id: string;
      start_time: string;
      class: {
        id: string;
        name: string;
        price: number;
        description: string;
      };
    };
  };
}

// Utility type to fix issues with invoiceItemEnhancer.ts
export interface BookingWithDetails {
  id: string;
  dogs: {
    name: string;
    breed?: string;
  };
  dog_id?: string;  // Add this to fix the TypeScript error
  class_schedules: {
    id: string;
    start_time: string;
    class_id: string;
    classes: {
      id: string;
      name: string;
      price: number;
      description: string;
      admin_fee_type?: string;
      admin_fee_value?: number;
      trainer_fee_type?: string;
      trainer_fee_value?: number; 
      mckaynine_commission_type?: string;
      mckaynine_commission_value?: number;
    };
  };
}
