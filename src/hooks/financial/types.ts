
// If this file doesn't exist yet, create it
export interface BookingRevenue {
  booking_id: string;
  client_id?: string;
  amount: number;
  invoice_id: string;
  status: string;
  branch_id?: string; // Add branch_id for better tracking
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
  sourceType: 'class' | 'general';
  invoiceIds: string[];
  branch_id?: string; // Add branch_id for better tracking
}

export interface FinancialData {
  bookingsWithInvoices: any[];
  allInvoicesCount: number;
  invalidInvoicesCount: number;
  totalRevenue: number;
  invoiceItems: any[];
  invoices: any[];
  branchId?: string; // Add branchId to track which branch this data is for
}
