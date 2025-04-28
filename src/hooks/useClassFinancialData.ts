
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialQuery } from "./financial/useFinancialQuery";
import { useFinancialProcessor } from "./financial/useFinancialProcessor";
import type { UseFinancialDataReturn, FinancialData } from "./financial/types";
import { useEffect } from "react";

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
  
  // Force refresh financial data on mount to ensure we have fresh data
  useEffect(() => {
    if (branchId) {
      // Only invalidate on the first render, not on every parameter change
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  }, [branchId, queryClient]); // Only run when branchId changes, not on every render
  
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
   * Returns the results of the refetch operation to match the expected return type
   */
  const refreshData = async (): Promise<unknown[]> => {
    // Invalidate key queries
    await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    
    // Force a complete refetch of all financial data
    const refetchResults = await queryClient.refetchQueries({ 
      queryKey: ['financial-bookings'],
      type: 'all'
    });
    
    return refetchResults;
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
