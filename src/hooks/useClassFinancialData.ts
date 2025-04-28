
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialQuery } from "./financial/useFinancialQuery";
import { useFinancialProcessor } from "./financial/useFinancialProcessor";
import type { UseFinancialDataReturn, FinancialData } from "./financial/types";

export function useClassFinancialData(
  branchId?: string,
  fromDate?: string,
  toDate?: string
): UseFinancialDataReturn {
  const queryClient = useQueryClient();
  
  const { 
    data: financialData,
    isLoading
  } = useFinancialQuery(branchId, fromDate, toDate);

  const {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  } = useFinancialProcessor(financialData as FinancialData);

  const refreshData = () => {
    console.log("Manually refreshing financial data");
    // Use promise-based invalidation to ensure data is invalidated before proceeding
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      queryClient.resetQueries({ queryKey: ['financial-bookings', branchId, fromDate, toDate] }),
      // Force refetch to get updated data
      queryClient.refetchQueries({ queryKey: ['financial-bookings'] })
    ]);
  };

  return {
    classFinances,
    isLoading,
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialData?.totalRevenue || 0,
    totalDiscounts: financialData?.totalDiscounts || 0
  };
}

export type { ClassFinance } from "./financial/types";
