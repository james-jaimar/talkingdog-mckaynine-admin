
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialQuery } from "./financial/useFinancialQuery";
import { useFinancialProcessor } from "./financial/useFinancialProcessor";
import type { UseFinancialDataReturn, FinancialData } from "./financial/types";
import { useEffect, useState, useRef } from "react";
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
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Create new abort controller when hook is mounted
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  // Always invalidate financial queries on mount to ensure fresh data
  useEffect(() => {
    if (branchId) {
      // Create a new abort controller for each invalidation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // Force invalidation of financial data on every mount
      queryClient.invalidateQueries({ 
        queryKey: ['financial-bookings', branchId, fromDate, toDate],
        exact: true,
        meta: { signal }
      });
      
      // Also invalidate invoices data
      queryClient.invalidateQueries({
        queryKey: ['invoices'],
        exact: false,
        meta: { signal }
      });
      
      // And trainer payment data
      queryClient.invalidateQueries({
        queryKey: ['trainer-payments'],
        exact: false,
        meta: { signal }
      });
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
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
   * Also handles proper cancellation of previous requests
   */
  const refreshData = async (): Promise<unknown[]> => {
    setIsRefreshing(true);
    
    try {
      // Cancel any ongoing requests first
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      // First completely reset all queries to clear any cached data
      await queryClient.resetQueries({ 
        queryKey: ['financial-bookings', branchId, fromDate, toDate],
        exact: true,
        meta: { signal }
      });
      
      // Then reset invoices cache
      await queryClient.resetQueries({ 
        queryKey: ['invoices'],
        exact: false,
        meta: { signal }
      });
      
      // Reset trainer payments cache
      await queryClient.resetQueries({
        queryKey: ['trainer-payments'],
        exact: false,
        meta: { signal }
      });
      
      // Force a complete refetch of financial data
      const results = await refetch();
      
      // Set timeout to ensure UI updates even if refetch is slow
      setTimeout(() => {
        if (!signal.aborted) {
          setIsRefreshing(false);
        }
      }, 500);
      
      // Properly transform the result to match the expected return type
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      // Only log if it's not an abort error
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error("Error refreshing financial data:", error);
        toast.error("Failed to refresh financial data");
      }
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
