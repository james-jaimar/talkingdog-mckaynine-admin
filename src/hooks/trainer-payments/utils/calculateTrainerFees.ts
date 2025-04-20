
import { Schedule, InvoiceItem } from "../types";

export function calculateTrainerFee(
  courseFee: number,
  schedule: Schedule
): number {
  if (!schedule.classes) return 0;
  
  const feeType = schedule.classes.trainer_fee_type;
  const feeValue = schedule.classes.trainer_fee_value || 0;
  
  if (feeType === 'percentage') {
    return courseFee * (feeValue / 100);
  }
  return feeValue;
}

export function calculateFranchiseFee(
  courseFee: number,
  enrollmentFee: number,
  schedule: Schedule
): number {
  if (!schedule.classes) return 0;
  
  const commissionType = schedule.classes.mckaynine_commission_type;
  const commissionValue = schedule.classes.mckaynine_commission_value || 0;
  
  let franchiseFee = enrollmentFee; // Start with enrollment fee
  
  // Add commission based on course fee
  if (commissionType === 'percentage') {
    franchiseFee += courseFee * (commissionValue / 100);
  } else {
    franchiseFee += commissionValue;
  }
  
  return franchiseFee;
}

export function calculateAdminFee(
  courseFee: number,
  schedule: Schedule
): number {
  if (!schedule.classes) return 0;
  
  const feeType = schedule.classes.admin_fee_type;
  const feeValue = schedule.classes.admin_fee_value || 0;
  
  if (feeType === 'percentage') {
    return courseFee * (feeValue / 100);
  }
  return feeValue;
}

export function calculateClassRevenue(
  invoiceItems: InvoiceItem[],
  schedule: Schedule
): { revenue: number; isPaid: boolean } {
  if (!schedule.classes) return { revenue: 0, isPaid: false };

  const courseFee = schedule.classes.course_fee || 0;
  const enrollmentFee = schedule.classes.enrollment_fee || 0;

  // Calculate trainer's revenue based on course fee only
  const trainerFee = calculateTrainerFee(courseFee, schedule);

  // Filter out cancelled invoices
  const validInvoiceItems = invoiceItems.filter(item => 
    item.invoices && item.invoices.status !== 'cancelled'
  );

  // Calculate total revenue and check payment status
  let isPaid = false;
  if (validInvoiceItems.length > 0) {
    isPaid = validInvoiceItems.some(item => item.invoices?.status === 'paid');
  }

  return {
    revenue: trainerFee,
    isPaid
  };
}
