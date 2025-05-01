
import { useState } from "react";
import { useFinancialQuery } from "@/hooks/financial/useFinancialQuery";
import { useFinancialProcessor } from "@/hooks/financial/useFinancialProcessor";
import { ClassFinance } from "@/hooks/financial/types";
import { useQueryClient } from "@tanstack/react-query";

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string) {
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { 
    data: financialData, 
    isLoading, 
    refetch
  } = useFinancialQuery(branchId, fromDate, toDate);
  
  const {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  } = useFinancialProcessor(financialData);
  
  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    await refetch();
    setRefreshTrigger(prev => prev + 1);
  };
  
  return {
    classFinances,
    isLoading,
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialData?.totalRevenue || 0,
  };
}

export type { ClassFinance };
