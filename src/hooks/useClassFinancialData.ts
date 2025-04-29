
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialQuery } from "./financial/useFinancialQuery";
import { useFinancialProcessor } from "./financial/useFinancialProcessor";
import type { UseFinancialDataReturn, FinancialData } from "./financial/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Hook for retrieving and processing financial data for classes
 * Always fetches fresh data on component mount
 */
export function useClassFinancialData(
  branchId?: string,
  fromDate?: string,
  toDate?: string
): UseFinancialDataReturn {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Always invalidate financial queries on mount to ensure fresh data
  useEffect(() => {
    if (branchId) {
      // Force invalidation of financial data on every mount
      queryClient.invalidateQueries({ 
        queryKey: ['financial-bookings', branchId, fromDate, toDate]
      });
      
      // Also invalidate invoices data
      queryClient.invalidateQueries({
        queryKey: ['invoices'],
        exact: false
      });
    }
  }, [branchId, queryClient, fromDate, toDate]);
  
  const { 
    data: financialData,
    isLoading,
    refetch
  } = useFinancialQuery(branchId, fromDate, toDate);

  const {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  } = useFinancialProcessor(financialData as FinancialData);

  /**
   * Refreshes financial data by properly invalidating caches and triggering refetches
   */
  const refreshData = async (): Promise<unknown[]> => {
    setIsRefreshing(true);
    
    try {
      // Reset queries first to clear all caches
      await queryClient.resetQueries({ 
        queryKey: ['financial-bookings', branchId, fromDate, toDate],
        exact: true
      });
      
      // Then reset invoices cache
      await queryClient.resetQueries({ 
        queryKey: ['invoices'],
        exact: false
      });
      
      // Force a complete refetch of financial data
      const results = await refetch();
      
      // Set timeout to ensure UI updates even if refetch is slow
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
      
      // Properly transform the result to match the expected return type
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      console.error("Error refreshing financial data:", error);
      toast.error("Failed to refresh financial data");
      setIsRefreshing(false);
      return [];
    }
  };

  return {
    classFinances,
    isLoading: isLoading || isRefreshing,
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialData?.totalRevenue || 0,
    totalDiscounts: financialData?.totalDiscounts || 0
  };
}

export type { ClassFinance } from "./financial/types";
