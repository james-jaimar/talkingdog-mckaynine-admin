
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialQuery } from "./financial/useFinancialQuery";
import { useFinancialProcessor } from "./financial/useFinancialProcessor";
import type { UseFinancialDataReturn, FinancialData } from "./financial/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Hook for retrieving and processing financial data for classes
 * Fixed to properly handle cache invalidation and prevent spinner issues
 */
export function useClassFinancialData(
  branchId?: string,
  fromDate?: string,
  toDate?: string
): UseFinancialDataReturn {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Only invalidate queries on mount, not on every parameter change
  useEffect(() => {
    if (branchId) {
      const warmCache = async () => {
        try {
          // Prefetch data without invalidating on first load
          await queryClient.prefetchQuery({
            queryKey: ['financial-bookings', branchId, fromDate, toDate],
          });
        } catch (error) {
          console.error("Error warming cache:", error);
        }
      };
      
      warmCache();
    }
    
    // Clean up function to reset query options
    return () => {
      queryClient.setQueryDefaults(['financial-bookings'], {
        staleTime: 30000,
      });
    };
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
   * Fixed to properly handle promise resolution and prevent spinner issues
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
