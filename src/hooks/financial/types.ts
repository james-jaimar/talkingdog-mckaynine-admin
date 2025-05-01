
export interface FinancialData {
  bookingsWithInvoices: any[];
  allInvoicesCount: number;
  invalidInvoicesCount: number;
  totalRevenue: number;
  invoiceItems: any[];
  invoices: any[];
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
}
