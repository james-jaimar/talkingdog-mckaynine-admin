
import { Schedule, InvoiceItem } from "../types";

export function calculateTrainerFee(
  item: InvoiceItem, 
  schedule: Schedule
): number {
  if (!schedule.classes) return 0;
  
  const feeType = schedule.classes.trainer_fee_type;
  const feeValue = schedule.classes.trainer_fee_value || 0;
  const invoiceAmount = item.amount || 0;
  
  if (feeType === 'percentage') {
    return invoiceAmount * (feeValue / 100);
  }
  return feeValue;
}

export function calculateClassRevenue(
  invoiceItems: InvoiceItem[],
  schedule: Schedule
): number {
  return invoiceItems.reduce((sum, item) => {
    if (!item.invoices || item.invoices.status === 'cancelled') return sum;
    return sum + calculateTrainerFee(item, schedule);
  }, 0);
}
