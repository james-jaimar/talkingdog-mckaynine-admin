
export interface ClassFinance {
  className: string;
  totalRevenue: number;
  bookingsCount: number;
  franchiseFee: number;
  adminFee: number;
  instructorFee: number;
  profit: number;
  invoiceCount: number;
  sourceType?: 'class' | 'general' | 'spanning';
  invoiceIds?: string[];
}

export interface BookingRevenue {
  bookingId: string;
  revenue: number;
  classId: string;
  className: string;
  invoiceAmount: number;
  invoiceId: string;
}

// Define the types that match the database query format
export interface ClassBooking {
  id: string;
  payment_status: string;
  class_schedules?: {
    id?: string;
    term_id?: string;
    selected_dates?: string[];
    classes?: {
      id: string;
      name: string;
      course_fee: number;
      mckaynine_commission_value: number;
      mckaynine_commission_type: string;
      admin_fee_value: number;
      admin_fee_type: string;
      trainer_fee_value: number;
      trainer_fee_type: string;
      branch_id?: string;
    };
  };
}

export interface BookingInvoice {
  id: string;
  invoice_id: string;
  booking_id: string;
  amount: number;
  invoices?: {
    id: string;
    status: string;
    payment_received?: boolean;
  };
}

export interface Invoice {
  id: string;
  total: number;
  status: string;
  client_id: string;
  issued_date: string;
  client?: {
    branch_id: string;
  };
}

export interface FinancialData {
  bookingsWithInvoices: ClassBooking[];
  allInvoicesCount: number;
  invalidInvoicesCount: number;
  totalRevenue: number;
  invoiceItems?: BookingInvoice[];
  invoices: Invoice[];
}
