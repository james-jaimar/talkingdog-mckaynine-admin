
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
  courseFee: number, // This is the net amount after any discounts
  enrollmentFee: number,
  schedule: Schedule
): number {
  if (!schedule.classes) return 0;
  
  const commissionType = schedule.classes.mckaynine_commission_type;
  const commissionValue = schedule.classes.mckaynine_commission_value || 0;
  
  let franchiseFee = enrollmentFee; // Start with enrollment fee
  
  // Add commission based on course fee (which is already net after discount)
  if (commissionType === 'percentage') {
    franchiseFee += courseFee * (commissionValue / 100);
  } else {
    franchiseFee += commissionValue;
  }
  
  return franchiseFee;
}

export function calculateAdminFee(
  courseFee: number, // This is already the net amount after any discounts
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

  // Use only paid invoice items and work with invoice total
  let actualRevenue = 0;
  const paidItems = new Set<string>(); // To track unique invoices
  
  // Group invoice items by invoice id to avoid counting the same invoice multiple times
  const invoiceMap = new Map<string, InvoiceItem>();
  
  // Get only the first item from each invoice to avoid double counting
  invoiceItems.forEach(item => {
    if (item.invoices?.status === 'paid' && !invoiceMap.has(item.invoices.id)) {
      invoiceMap.set(item.invoices.id, item);
    }
  });
  
  // Calculate revenue only from paid unique invoices using their total
  Array.from(invoiceMap.values()).forEach(item => {
    if (item.invoices?.status === 'paid') {
      // We need to ensure the type has total property
      const invoiceTotal = (item.invoices as any).total || 0;
      
      // If there are multiple bookings for this invoice, distribute evenly
      const bookingIds = new Set(
        invoiceItems
          .filter(ii => ii.invoices && ii.invoices.id === item.invoices?.id && ii.booking_id)
          .map(ii => ii.booking_id!)
      );
      
      const bookingCount = bookingIds.size || 1;
      const invoicePerBooking = invoiceTotal / bookingCount;
      
      // Add revenue if this item is associated with one of our bookings
      const isForCurrentSchedule = invoiceItems.some(ii => 
        ii.invoices && ii.invoices.id === item.invoices?.id && 
        bookings.some(b => b.id === ii.booking_id)
      );
      
      if (isForCurrentSchedule) {
        if (trainerFeeType === 'percentage') {
          actualRevenue += invoicePerBooking * (trainerFeeValue / 100);
        } else {
          actualRevenue += trainerFeeValue;
        }
        paidItems.add(item.invoices.id);
      }
    }
  });

  return {
    revenue: actualRevenue,
    isPaid: paidItems.size > 0, // Class is paid if we have at least one paid invoice
    bookingsCount,
    potentialRevenue
  };
}
