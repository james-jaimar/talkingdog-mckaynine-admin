
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
    refetch,
    error
  } = useFinancialQuery(branchId, fromDate, toDate);
  
  const {
    classFinances,
    totalInvoiceCount,
    invalidInvoicesCount
  } = useFinancialProcessor(financialData);
  
  // Add branch_id to all classFinances if not already set
  const enrichedClassFinances = classFinances.map(cf => ({
    ...cf,
    branch_id: cf.branch_id || financialData?.branchId || branchId
  }));
  
  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    await queryClient.invalidateQueries({ queryKey: ['financial-bookings', branchId] });
    await queryClient.removeQueries({ queryKey: ['financial-bookings'] }); // Remove any queries without branch ID
    await refetch();
    setRefreshTrigger(prev => prev + 1);
  };
  
  return {
    classFinances: enrichedClassFinances,
    isLoading,
    refreshData,
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: financialData?.totalRevenue || 0,
    courseFeeRevenue: financialData?.courseFeeRevenue || 0,
    enrollmentFeeRevenue: financialData?.enrollmentFeeRevenue || 0,
    error
  };
}

export type { ClassFinance };
