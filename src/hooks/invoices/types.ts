
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'invalid';

export interface InvoiceClient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  branch_id?: string;
  // Add missing properties used in ClientInfoCard and ClientInfo
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

export interface BookingDetails {
  id: string;
  dogs: {
    name: string;
    breed: string;
  };
  class_schedules: {
    id: string;
    start_time: string;
    term_id?: string;
    class_id: string;
    classes: {
      id: string;
      name: string;
      description: string;
      course_fee: number;
    };
  };
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  booking_id?: string | null;
  term_id?: string | null;
  bookings?: BookingDetails;
  created_at?: string;
  updated_at?: string;
}

export interface BookingWithDetails {
  id?: string; 
  dog_id?: string;
  client_id?: string;
  class_schedule_id?: string;
  booking_id?: string;
  status?: string;
  payment_status?: string;
  dogs?: {
    name: string;
    breed?: string;
  };
  class_schedules?: {
    id: string;
    term_id?: string;
    start_time: string;
    class_id?: string; // Add the missing class_id property
    classes: {
      id: string;
      name: string;
      price?: number;
      course_fee?: number;
    };
  };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client?: InvoiceClient;
  issued_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'percentage' | 'fixed';
  discount_amount: number;
  total: number;
  status: InvoiceStatus;
  payment_received?: boolean;
  payment_date?: string;
  items?: InvoiceItem[];
  email_sent?: boolean;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  term_id?: string;
  original_discount_type?: 'percentage' | 'fixed';
  original_discount_amount?: number;
  monetary_discount?: number;
  discount_reason?: string;
  classInfo?: string;
  dogInfo?: string;
  
  // Add missing properties used in AllocationChartData
  trainer_fee?: number;
  franchise_fee?: number;
  admin_fee?: number;
}
