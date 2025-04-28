
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialQuery } from "./financial/useFinancialQuery";
import { useFinancialProcessor } from "./financial/useFinancialProcessor";
import type { UseFinancialDataReturn, FinancialData } from "./financial/types";

/**
 * Hook for retrieving and processing financial data for classes
 * Optimized to reduce excessive logs and improve data fetching efficiency
 */
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

  /**
   * Refreshes financial data by invalidating caches and triggering refetches
   * Returns results to match expected return type
   */
  const refreshData = async () => {
    // Invalidate key queries
    const invalidationResults = await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    ]);
    
    // Force a refetch of the current data
    const refetchResults = await queryClient.refetchQueries({ 
      queryKey: ['financial-bookings', branchId, fromDate, toDate],
      exact: true
    });
    
    // Return combined results
    return [...invalidationResults, refetchResults];
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
