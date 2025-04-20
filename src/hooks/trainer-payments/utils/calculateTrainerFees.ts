
import { Schedule, InvoiceItem, Booking } from "../types";

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
  bookings: Booking[],
  schedule: Schedule,
  invoiceItems: InvoiceItem[] = []
): { 
  revenue: number; 
  isPaid: boolean;
  bookingsCount: number;
  potentialRevenue: number;
} {
  if (!schedule.classes) {
    return { 
      revenue: 0, 
      isPaid: false, 
      bookingsCount: 0, 
      potentialRevenue: 0 
    };
  }

  // Get fee values from the class
  const courseFee = schedule.classes.course_fee || 0;
  const trainerFeeType = schedule.classes.trainer_fee_type;
  const trainerFeeValue = schedule.classes.trainer_fee_value || 0;
  
  // Calculate potential revenue per booking based on class configuration
  const potentialRevenuePerBooking = trainerFeeType === 'percentage' 
    ? courseFee * (trainerFeeValue / 100) 
    : trainerFeeValue;

  // Count total bookings for this schedule
  const bookingsCount = bookings.length;
  
  // Calculate total potential revenue based on bookings count
  const potentialRevenue = bookingsCount * potentialRevenuePerBooking;

  // Filter out cancelled invoices
  const validInvoiceItems = invoiceItems.filter(item => 
    item.invoices && item.invoices.status !== 'cancelled'
  );

  // Calculate actual paid revenue from invoice items
  let actualRevenue = 0;
  
  // Calculate revenue only from paid invoice items
  for (const item of validInvoiceItems) {
    if (item.invoices?.status === 'paid') {
      if (trainerFeeType === 'percentage') {
        actualRevenue += (item.amount || 0) * (trainerFeeValue / 100);
      } else {
        actualRevenue += trainerFeeValue;
      }
    }
  }

  // Important: A class is only considered paid if there is actual revenue
  // AND if there are valid invoice items that are paid
  const hasPaidInvoices = validInvoiceItems.some(item => item.invoices?.status === 'paid');

  return {
    revenue: actualRevenue,
    isPaid: actualRevenue > 0 && hasPaidInvoices, // Only mark as paid if we have actual revenue AND paid invoices
    bookingsCount,
    potentialRevenue
  };
}
