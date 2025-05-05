
import { Schedule, Booking, InvoiceItem } from "../types";

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
  
  // Get amount from paid invoice items
  const bookingIds = bookings.map(b => b.id);
  
  // Calculate actual revenue from paid invoices
  const paidInvoiceItems = invoiceItems.filter(item => 
    item.booking_id && 
    bookingIds.includes(item.booking_id) && 
    item.invoices?.status === 'paid'
  );

  // Calculate potential revenue from all invoice items (paid or unpaid)
  const allValidInvoiceItems = invoiceItems.filter(item => 
    item.booking_id && 
    bookingIds.includes(item.booking_id) && 
    item.invoices?.status !== 'cancelled'
  );

  // If there are paid items, calculate actual revenue
  if (paidInvoiceItems.length > 0) {
    let paidAmount = paidInvoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    // Round to 2 decimal places to avoid floating point errors
    paidAmount = parseFloat(paidAmount.toFixed(2));
    
    // Apply trainer fee calculation with proper rounding
    if (trainerFeeType === 'percentage') {
      revenue = parseFloat((paidAmount * (trainerFeeValue / 100)).toFixed(2));
      console.log(`Trainer revenue calculation (percentage): ${paidAmount} * ${trainerFeeValue}% = ${revenue}`);
    } else if (trainerFeeType === 'fixed') {
      // For fixed fee, we apply the fixed amount per booking
      revenue = parseFloat((paidInvoiceItems.length * trainerFeeValue).toFixed(2));
      console.log(`Trainer revenue calculation (fixed): ${paidInvoiceItems.length} bookings * ${trainerFeeValue} = ${revenue}`);
    }
    
    // If there are paid invoice items, consider the class as paid
    isPaid = true;
  }

  // Calculate potential revenue from all valid invoice items
  if (allValidInvoiceItems.length > 0) {
    let totalAmount = allValidInvoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    // Round to 2 decimal places
    totalAmount = parseFloat(totalAmount.toFixed(2));
    
    // Apply trainer fee calculation with proper rounding
    if (trainerFeeType === 'percentage') {
      potentialRevenue = parseFloat((totalAmount * (trainerFeeValue / 100)).toFixed(2));
      console.log(`Trainer potential revenue calculation (percentage): ${totalAmount} * ${trainerFeeValue}% = ${potentialRevenue}`);
    } else if (trainerFeeType === 'fixed') {
      // For fixed fee, we apply the fixed amount per booking
      potentialRevenue = parseFloat((allValidInvoiceItems.length * trainerFeeValue).toFixed(2));
      console.log(`Trainer potential revenue calculation (fixed): ${allValidInvoiceItems.length} bookings * ${trainerFeeValue} = ${potentialRevenue}`);
    }
  } else if (bookings.length > 0 && schedule.classes.course_fee) {
    // If no invoice items but bookings exist, calculate based on course fee
    const estimatedTotal = bookings.length * (schedule.classes.course_fee || 0);
    
    if (trainerFeeType === 'percentage') {
      potentialRevenue = parseFloat((estimatedTotal * (trainerFeeValue / 100)).toFixed(2));
      console.log(`Trainer estimated revenue calculation (percentage, no invoices): ${estimatedTotal} * ${trainerFeeValue}% = ${potentialRevenue}`);
    } else if (trainerFeeType === 'fixed') {
      potentialRevenue = parseFloat((bookings.length * trainerFeeValue).toFixed(2));
      console.log(`Trainer estimated revenue calculation (fixed, no invoices): ${bookings.length} bookings * ${trainerFeeValue} = ${potentialRevenue}`);
    }
  }

  return {
    revenue,
    potentialRevenue,
    isPaid
  };
}
