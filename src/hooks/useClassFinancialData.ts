
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

  const refreshData = async () => {
    console.log("Manually refreshing financial data");
    // Use promise-based invalidation to ensure data is invalidated before proceeding
    return Promise.all([
      // First invalidate all queries
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['invoices'] }),
      
      // Then reset the specific query to force a clean refetch
      queryClient.resetQueries({ 
        queryKey: ['financial-bookings', branchId, fromDate, toDate],
        exact: true
      })
    ]).then(() => {
      // After invalidation/reset, force a refetch
      return queryClient.refetchQueries({ 
        queryKey: ['financial-bookings', branchId, fromDate, toDate],
        exact: true,
        type: 'active'
      });
    });
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
