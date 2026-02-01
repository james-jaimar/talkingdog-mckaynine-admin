import { Schedule, Booking, InvoiceItem } from "../types";
import { getCourseFeeAmount, applyInvoiceDiscountToItems } from "@/lib/invoiceItemUtils";
import { roundToCents } from "@/lib/invoiceMath";

interface RevenueDetails {
  revenue: number;
  potentialRevenue: number;
  isPaid: boolean;
}

/**
 * Calculate revenue for a class based on bookings and invoice items
 * 
 * IMPORTANT: This now applies invoice-level discounts to get accurate net amounts
 * before calculating trainer fees.
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
    
    // Check if this invoice belongs to the correct branch (use invoice.branch_id, not client.branch_id)
    // This supports cross-branch enrollments (e.g., Randburg client in Delta class)
    const invoiceBranchId = item.invoices?.branch_id;
    const matchesBranch = !scheduleBranchId || !invoiceBranchId || scheduleBranchId === invoiceBranchId;
    
    return matchesBooking && matchesBranch;
  });
  
  // Apply invoice-level discounts to get accurate net amounts
  // Transform items to have the invoices shape expected by applyInvoiceDiscountToItems
  const itemsWithInvoiceData = branchFilteredInvoiceItems.map(item => ({
    ...item,
    invoices: item.invoices ? {
      subtotal: item.invoices.subtotal,
      monetary_discount: item.invoices.monetary_discount,
      discount_type: item.invoices.discount_type,
      discount_amount: item.invoices.discount_amount,
      status: item.invoices.status
    } : null
  }));
  
  const discountedItems = applyInvoiceDiscountToItems(itemsWithInvoiceData);
  
  // Create a map of original item id to discounted item for status lookup
  const discountedItemMap = new Map(discountedItems.map(item => [item.id, item]));
  
  // Calculate actual revenue from paid invoices (using net amounts)
  const paidDiscountedItems = discountedItems.filter(item => {
    const originalItem = branchFilteredInvoiceItems.find(i => i.id === item.id);
    return originalItem?.invoices?.status === 'paid';
  });

  // Calculate potential revenue from all invoice items (paid or unpaid, using net amounts)
  const allValidDiscountedItems = discountedItems.filter(item => {
    const originalItem = branchFilteredInvoiceItems.find(i => i.id === item.id);
    return originalItem?.invoices?.status !== 'cancelled';
  });

  // If there are paid items, calculate actual revenue
  // IMPORTANT: Use only course fees (exclude enrollment fees) and use NET amounts
  if (paidDiscountedItems.length > 0) {
    // Get course fee amount only (excluding enrollment fees), using net_amount
    const paidAmount = getCourseFeeAmount(paidDiscountedItems, true);
    
    // Apply trainer fee calculation
    if (trainerFeeType === 'percentage') {
      revenue = roundToCents(paidAmount * (trainerFeeValue / 100));
    } else if (trainerFeeType === 'fixed') {
      // For fixed fee, we apply the fixed amount per booking
      revenue = roundToCents(paidDiscountedItems.length * trainerFeeValue);
    }
    
    // If there are paid invoice items, consider the class as paid
    isPaid = true;
  }

  // Calculate potential revenue from all valid invoice items
  // IMPORTANT: Use only course fees (exclude enrollment fees) and use NET amounts
  if (allValidDiscountedItems.length > 0) {
    // Get course fee amount only (excluding enrollment fees), using net_amount
    const totalAmount = getCourseFeeAmount(allValidDiscountedItems, true);
    
    // Apply trainer fee calculation
    if (trainerFeeType === 'percentage') {
      potentialRevenue = roundToCents(totalAmount * (trainerFeeValue / 100));
    } else if (trainerFeeType === 'fixed') {
      // For fixed fee, we apply the fixed amount per booking
      potentialRevenue = roundToCents(allValidDiscountedItems.length * trainerFeeValue);
    }
  } else if (bookings.length > 0 && schedule.classes.course_fee) {
    // If no invoice items but bookings exist, calculate based on course fee
    const estimatedTotal = bookings.length * (schedule.classes.course_fee || 0);
    
    if (trainerFeeType === 'percentage') {
      potentialRevenue = roundToCents(estimatedTotal * (trainerFeeValue / 100));
    } else if (trainerFeeType === 'fixed') {
      potentialRevenue = roundToCents(bookings.length * trainerFeeValue);
    }
  }

  return {
    revenue,
    potentialRevenue,
    isPaid
  };
}
