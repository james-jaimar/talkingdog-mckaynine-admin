
import { useState, useEffect } from "react";
import { useFinancialQuery } from "@/hooks/financial/useFinancialQuery";
import { useFinancialProcessor } from "@/hooks/financial/useFinancialProcessor";
import { ClassFinance } from "@/hooks/financial/types";
import { useQueryClient } from "@tanstack/react-query";

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string) {
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [branchMismatch, setBranchMismatch] = useState(false);
  
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
  
  // Verify that all class finances are from the correct branch
  useEffect(() => {
    if (branchId && classFinances.length > 0) {
      // Check if the financial data indicates mismatched branch
      const mismatch = classFinances.some(c => 
        c.branch_id && c.branch_id !== branchId
      );
      
      if (mismatch) {
        console.error(`Found financial data for incorrect branch. Current branch: ${branchId}, but some data belongs to other branches.`);
        setBranchMismatch(true);
      } else {
        setBranchMismatch(false);
      }
    }
  }, [classFinances, branchId]);
  
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
    error,
    branchMismatch
  };
}

export type { ClassFinance };
