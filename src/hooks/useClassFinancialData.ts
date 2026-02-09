import { useState } from "react";
import { useFinancialQuery } from "@/hooks/financial/useFinancialQuery";
import { useFinancialProcessor } from "@/hooks/financial/useFinancialProcessor";
import { ClassFinance } from "@/hooks/financial/types";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Helper to normalize date to YYYY-MM-DD format
 * This prevents timezone issues when filtering by date in the database
 */
function normalizeToDateString(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Parse ISO string and extract date portion
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return undefined;
  }
}

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string, filterMode: 'term' | 'monthly' = 'term') {
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Normalize dates to YYYY-MM-DD format to avoid timezone issues
  const normalizedFromDate = normalizeToDateString(fromDate);
  const normalizedToDate = normalizeToDateString(toDate);
  
  // Use 'term' mode for dashboard to filter by issued_date range
  // This ensures Total Revenue matches Collected + Pending + Overdue
  const { 
    data: financialData, 
    isLoading, 
    refetch,
    error
  } = useFinancialQuery(branchId, normalizedFromDate, normalizedToDate, filterMode);
  
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
    // Clear all financial data queries for this branch
    await queryClient.invalidateQueries({ queryKey: ['financial-data'] });
    await queryClient.invalidateQueries({ queryKey: ['financial-data', branchId] });
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
