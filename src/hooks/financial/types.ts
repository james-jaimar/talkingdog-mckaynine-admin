
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
  invoiceIds?: string[];
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

export interface FinancialData {
  bookingsWithInvoices: any[];
  allInvoicesCount: number;
  invalidInvoicesCount: number;
  totalRevenue: number;
  totalDiscounts: number;
  invoiceItems?: any[];
  classInvoiceMap?: Array<{
    className: string;
    invoiceIds: string[];
  }>;
}

export interface UseFinancialDataReturn {
  classFinances: ClassFinance[];
  isLoading: boolean;
  refreshData: () => Promise<unknown[]>;
  totalInvoiceCount: number;
  invalidInvoicesCount: number;
  totalRevenue: number;
  totalDiscounts: number;
}
