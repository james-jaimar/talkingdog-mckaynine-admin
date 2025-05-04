
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
  // Check if trainer_fee_value is specifically set to 0
  const trainerFeeValue = schedule.classes.trainer_fee_value;
  
  // If trainer fee is explicitly set to 0, return zeros (no commission)
  if (trainerFeeValue === 0) {
    console.log(`Schedule ${schedule.id} has zero commission configuration: ${trainerFeeType}/${trainerFeeValue}`);
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
    const paidAmount = paidInvoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
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
  if (allValidInvoiceItems.length > 0) {
    const totalAmount = allValidInvoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
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
