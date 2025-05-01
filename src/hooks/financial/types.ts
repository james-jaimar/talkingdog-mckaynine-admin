
// Update the FinancialData type to no longer include totalDiscounts
export interface FinancialData {
  bookingsWithInvoices: BookingWithSchedule[];
  allInvoicesCount: number;
  invalidInvoicesCount: number;
  totalRevenue: number;
  invoiceItems: InvoiceItemWithInvoice[];
}

export interface BookingWithSchedule {
  id: string;
  payment_status?: string;
  class_schedules?: {
    classes?: {
      id: string;
      name: string;
      course_fee?: number;
      mckaynine_commission_value: number;
      mckaynine_commission_type: string;
      admin_fee_value: number;
      admin_fee_type: string;
      trainer_fee_value: number;
      trainer_fee_type: string;
    };
  };
}

export interface ClassFinance {
  className: string;
  totalRevenue: number;
  bookingsCount: number;
  franchiseFee: number;
  adminFee: number;
  instructorFee: number;
  profit: number;
  invoiceCount: number;
  sourceType?: 'class' | 'general';
  invoiceIds: string[];
}

export interface InvoiceDiscount {
  discountAmount: number;
  subtotal: number; 
  total: number;
}

export interface BookingRevenue {
  totalRevenue: number;
  invoiceIds: Set<string>;
}

export interface InvoiceItemWithInvoice {
  id: string;
  invoice_id: string;
  booking_id?: string;
  amount?: number;
  unit_price?: number;
  quantity?: number;
  description?: string;
  invoices?: {
    id: string;
    status?: string;
    payment_received?: boolean;
    total?: number;
    subtotal?: number;
    tax_amount?: number;
    client_id?: string;
    issued_date?: string;
    invoice_number?: string;
    client?: {
      branch_id?: string;
    };
  };
}
