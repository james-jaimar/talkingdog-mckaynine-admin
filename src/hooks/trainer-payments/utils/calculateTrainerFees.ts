
import { Schedule, Booking, InvoiceItem } from "../types";
import { getCourseFeeAmount } from "@/lib/invoiceItemUtils";

interface RevenueDetails {
  revenue: number;
  potentialRevenue: number;
  isPaid: boolean;
}

/**
 * Calculate revenue for a class based on bookings and invoice items
 */
export function calculateClassRevenue(
  bookings: Booking[],
  schedule: Schedule,
  invoiceItems: InvoiceItem[]
): RevenueDetails {
  // Get branch ID from schedule
  const scheduleBranchId = schedule.classes?.branch_id;
  
  // Default values
  let revenue = 0;
  let potentialRevenue = 0;
  let isPaid = false;

  // If no class data available, return zeros
  if (!schedule.classes) {
    return { revenue: 0, potentialRevenue: 0, isPaid: false };
  }

  // Get trainer fee configuration from the class
  const trainerFeeType = schedule.classes.trainer_fee_type || 'percentage';
  // Check if trainer_fee_value is specifically set to 0 versus undefined
  // Use a default of 70% only if the value is undefined, not if it's intentionally 0
  const trainerFeeValue = schedule.classes.trainer_fee_value !== undefined 
    ? schedule.classes.trainer_fee_value 
    : 70; 
  
  // If trainer fee is explicitly set to 0, return zeros (no commission)
  if (trainerFeeValue === 0) {
    return { revenue: 0, potentialRevenue: 0, isPaid: false };
  }
  
  // Get booking IDs for this class
  const bookingIds = bookings.map(b => b.id);
  
  // Filter invoice items to ensure they match the correct branch and bookings
  const branchFilteredInvoiceItems = invoiceItems.filter(item => {
    // Check if this invoice item is for a booking in our list
    const matchesBooking = item.booking_id && bookingIds.includes(item.booking_id);
    
    // Check if this invoice belongs to the correct branch
    const invoiceBranchId = item.invoices?.client?.branch_id;
    const matchesBranch = !scheduleBranchId || !invoiceBranchId || scheduleBranchId === invoiceBranchId;
    
    return matchesBooking && matchesBranch;
  });
  
  // Calculate actual revenue from paid invoices
  const paidInvoiceItems = branchFilteredInvoiceItems.filter(item => 
    item.booking_id && 
    bookingIds.includes(item.booking_id) && 
    item.invoices?.status === 'paid'
  );

  // Calculate potential revenue from all invoice items (paid or unpaid)
  const allValidInvoiceItems = branchFilteredInvoiceItems.filter(item => 
    item.booking_id && 
    bookingIds.includes(item.booking_id) && 
    item.invoices?.status !== 'cancelled'
  );

  // If there are paid items, calculate actual revenue
  // IMPORTANT: Use only course fees (exclude enrollment fees) for trainer fee calculations
  if (paidInvoiceItems.length > 0) {
    // Get course fee amount only (excluding enrollment fees)
    const paidAmount = getCourseFeeAmount(paidInvoiceItems);
    
    // Apply trainer fee calculation
    if (trainerFeeType === 'percentage') {
      revenue = paidAmount * (trainerFeeValue / 100);
    } else if (trainerFeeType === 'fixed') {
      // For fixed fee, we apply the fixed amount per booking
      revenue = paidInvoiceItems.length * trainerFeeValue;
    }
    
    // If there are paid invoice items, consider the class as paid
    isPaid = true;
  }

  // Calculate potential revenue from all valid invoice items
  // IMPORTANT: Use only course fees (exclude enrollment fees)
  if (allValidInvoiceItems.length > 0) {
    // Get course fee amount only (excluding enrollment fees)
    const totalAmount = getCourseFeeAmount(allValidInvoiceItems);
    
    // Apply trainer fee calculation
    if (trainerFeeType === 'percentage') {
      potentialRevenue = totalAmount * (trainerFeeValue / 100);
    } else if (trainerFeeType === 'fixed') {
      // For fixed fee, we apply the fixed amount per booking
      potentialRevenue = allValidInvoiceItems.length * trainerFeeValue;
    }
  } else if (bookings.length > 0 && schedule.classes.course_fee) {
    // If no invoice items but bookings exist, calculate based on course fee
    const estimatedTotal = bookings.length * (schedule.classes.course_fee || 0);
    
    if (trainerFeeType === 'percentage') {
      potentialRevenue = estimatedTotal * (trainerFeeValue / 100);
    } else if (trainerFeeType === 'fixed') {
      potentialRevenue = bookings.length * trainerFeeValue;
    }
  }

  return {
    revenue,
    potentialRevenue,
    isPaid
  };
}
