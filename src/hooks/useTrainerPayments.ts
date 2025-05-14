
import { useTrainerPaymentData } from "./useTrainerPaymentData";

export function useTrainerPayments(branchId?: string, fromDate?: string, toDate?: string) {
  // Convert string dates to Date objects if provided, otherwise use null
  const dateRange = fromDate && toDate 
    ? { from: new Date(fromDate), to: new Date(toDate) }
    : undefined;
    
  // Use the underlying hook and pass through all its properties
  const result = useTrainerPaymentData(branchId, dateRange);
  
  return result;
}
