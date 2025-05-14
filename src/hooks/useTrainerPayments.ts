
import { useTrainerPaymentData } from "./useTrainerPaymentData";

export function useTrainerPayments(branchId?: string, dateRange?: { from: Date; to: Date }) {
  return useTrainerPaymentData(branchId, dateRange);
}
