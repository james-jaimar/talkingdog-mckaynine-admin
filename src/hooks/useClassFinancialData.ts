
import { useFinancialData } from "@/context/FinancialDataContext";
import { useEffect } from "react";
import type { ClassFinance } from "./financial/types";

/**
 * Hook for retrieving and processing financial data for classes
 * Leverages the centralized FinancialDataContext
 */
export function useClassFinancialData(
  branchId?: string,
  fromDate?: string,
  toDate?: string
) {
  const financialData = useFinancialData();
  
  // Fetch financial data when parameters change
  useEffect(() => {
    if (branchId) {
      console.log(`Fetching financial data for branch ${branchId} from ${fromDate || 'unknown'} to ${toDate || 'unknown'}`);
      financialData.fetchFinancialData(branchId, fromDate || '', toDate || '');
    }
  }, [branchId, fromDate, toDate, financialData]);

  return {
    classFinances: financialData.classFinances,
    isLoading: financialData.isLoading,
    isRefreshing: financialData.isRefreshing,
    refreshData: financialData.refreshData,
    totalInvoiceCount: financialData.totalInvoiceCount,
    invalidInvoicesCount: financialData.invalidInvoicesCount,
    totalRevenue: financialData.totalRevenue,
    totalDiscounts: financialData.totalDiscounts
  };
}

export type { ClassFinance };
