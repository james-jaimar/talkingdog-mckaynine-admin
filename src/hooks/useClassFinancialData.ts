
import { useState, useCallback } from "react";
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
    refetch,
    error
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
  
  const refreshData = useCallback(async () => {
    // Log the refresh attempt
    console.log("Refreshing financial data with params:", { branchId, fromDate, toDate });
    
    try {
      await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      
      // Wait for the refetch to complete
      const result = await refetch();
      
      // Log successful refresh
      console.log("Financial data refreshed successfully:", {
        bookingsCount: result.data?.bookings.length || 0,
        totalRevenue: result.data?.totalRevenue || 0
      });
      
      // Update the trigger to force re-render
      setRefreshTrigger(prev => prev + 1);
      return true;
    } catch (err) {
      console.error("Error refreshing financial data:", err);
      return false;
    }
  }, [branchId, fromDate, toDate, queryClient, refetch]);
  
  // Log query state
  console.log("useClassFinancialData hook state:", {
    isLoading, 
    hasError: !!error,
    bookingsCount: financialBookingData?.bookings.length || 0,
    classFinancesCount: classFinances.length,
    refreshTrigger,
    branchId,
    fromDate,
    toDate
  });
  
  return {
    classFinances,
    isLoading,
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialBookingData?.totalRevenue || 0,
    error
  };
}

export type { ClassFinance };
