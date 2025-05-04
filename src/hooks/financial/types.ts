// Update the FinancialData type to include invoices
export interface FinancialData {
  bookingsWithInvoices: BookingWithSchedule[];
  allInvoicesCount: number;
  invalidInvoicesCount: number;
  totalRevenue: number;
  invoiceItems: InvoiceItemWithInvoice[];
  invoices: InvoiceData[];
}

// Add the missing FinancialBookingData interface
export interface FinancialBookingData {
  bookings: any[]; // This is actually BookingWithSchedule[] but might need type adjustment
  totalRevenue: number;
  uniqueClients: number;
  uniqueHandlers: number;
  uniqueSchedules: number;
  branchId: string;
  fromDate: string;
  toDate: string;
}

// ... keep existing code (BookingWithSchedule, ClassFinance, etc.)

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

// ... keep existing code (all other interfaces)
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

export interface InvoiceData {
  id: string;
  total: number;
  status: string;
  client_id: string;
  issued_date: string;
  client?: {
    branch_id?: string;
  };
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
