
import { useState } from "react";
import { useFinancialQuery } from "@/hooks/financial/useFinancialQuery";
import { useFinancialProcessor } from "@/hooks/financial/useFinancialProcessor";
import { ClassFinance, FinancialData } from "@/hooks/financial/types";
import { useQueryClient } from "@tanstack/react-query";

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string) {
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { 
    data: financialBookingData, 
    isLoading, 
    refetch
  } = useFinancialQuery(branchId, fromDate, toDate);
  
  // Transform FinancialBookingData to FinancialData for compatibility
  const financialData: FinancialData | undefined = financialBookingData ? {
    bookingsWithInvoices: financialBookingData.bookings,
    allInvoicesCount: 0, // Will be calculated by the processor
    invalidInvoicesCount: 0, // Will be calculated by the processor
    totalRevenue: financialBookingData.totalRevenue,
    invoiceItems: [], // Will be populated based on bookings
    invoices: [] // Will be populated based on bookings
  } : undefined;
  
  const {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  } = useFinancialProcessor(financialData);
  
  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    await refetch();
    setRefreshTrigger(prev => prev + 1);
  };
  
  return {
    classFinances,
    isLoading,
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialBookingData?.totalRevenue || 0,
  };
}

export type { ClassFinance };
