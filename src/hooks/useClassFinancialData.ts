
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialQuery } from "./financial/useFinancialQuery";
import { useFinancialProcessor } from "./financial/useFinancialProcessor";
import type { UseFinancialDataReturn } from "./financial/types";

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
  } = useFinancialProcessor(financialData);

  const refreshData = () => {
    console.log("Manually refreshing financial data");
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
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
