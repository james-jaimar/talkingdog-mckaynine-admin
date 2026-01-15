/**
 * Utility functions for working with invoice items
 * Specifically for identifying and filtering enrollment fees from course fees
 */

export interface InvoiceItemLike {
  description?: string;
  item_type?: string;
  amount?: number;
}

export interface InvoiceItemWithDiscount extends InvoiceItemLike {
  invoices?: {
    subtotal?: number;
    monetary_discount?: number;
    discount_type?: string;
    discount_amount?: number;
    status?: string;
    payment_received?: boolean;
  } | null;
}

/**
 * Check if an invoice item is an enrollment fee
 * Enrollment fees should be excluded from percentage-based fee calculations
 * (admin fee, trainer fee, franchise/McKaynine commission)
 */
export function isEnrollmentFeeItem(item: InvoiceItemLike): boolean {
  // Check the item_type column first (preferred method after DB migration)
  if (item.item_type === 'enrollment_fee') return true;
  
  // Fallback: check description for legacy items without item_type set
  const desc = (item.description || '').toLowerCase();
  return desc.includes('enrollment fee') || 
         desc.includes('enrolment fee') || 
         desc.includes('starter kit');
}

/**
 * Apply invoice-level discount proportionally to invoice items
 * Returns items with discounted amounts based on their share of the subtotal
 * 
 * This is crucial for accurate financial reporting when manual discounts are applied
 * to invoices (e.g., 25% discount). The discount is distributed proportionally
 * across all items based on their share of the invoice subtotal.
 */
export function applyInvoiceDiscountToItems<T extends InvoiceItemWithDiscount>(
  items: T[]
): Array<{ amount: number; description?: string; item_type?: string }> {
  if (!items || items.length === 0) return [];
  
  const discountedItems: Array<{ amount: number; description?: string; item_type?: string }> = [];
  
  items.forEach(item => {
    const invoice = item.invoices;
    const originalAmount = item.amount || 0;
    
    if (!invoice) {
      // No invoice data, use original amount
      discountedItems.push({
        amount: originalAmount,
        description: item.description,
        item_type: item.item_type
      });
      return;
    }
    
    const subtotal = invoice.subtotal || 0;
    const monetaryDiscount = invoice.monetary_discount || 0;
    
    // If there's a discount and we have a valid subtotal
    if (monetaryDiscount > 0 && subtotal > 0) {
      // Calculate the discount ratio for this invoice
      const discountRatio = monetaryDiscount / subtotal;
      
      // Apply proportional discount to this item (round to nearest cent)
      const itemDiscount = Math.round(originalAmount * discountRatio * 100) / 100;
      const discountedAmount = Math.round((originalAmount - itemDiscount) * 100) / 100;
      
      discountedItems.push({
        amount: discountedAmount,
        description: item.description,
        item_type: item.item_type
      });
    } else {
      // No discount or invalid subtotal, use original amount
      discountedItems.push({
        amount: originalAmount,
        description: item.description,
        item_type: item.item_type
      });
    }
  });
  
  return discountedItems;
}

/**
 * Get the course fee amount from a list of invoice items
 * Excludes enrollment fees which are pass-through to the franchise owner
 */
export function getCourseFeeAmount(items: InvoiceItemLike[]): number {
  return items
    .filter(item => !isEnrollmentFeeItem(item))
    .reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Get the enrollment fee amount from a list of invoice items
 */
export function getEnrollmentFeeAmount(items: InvoiceItemLike[]): number {
  return items
    .filter(item => isEnrollmentFeeItem(item))
    .reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Split invoice items into course fees and enrollment fees
 */
export function splitInvoiceItems(items: InvoiceItemLike[]): {
  courseItems: InvoiceItemLike[];
  enrollmentItems: InvoiceItemLike[];
} {
  const courseItems: InvoiceItemLike[] = [];
  const enrollmentItems: InvoiceItemLike[] = [];
  
  items.forEach(item => {
    if (isEnrollmentFeeItem(item)) {
      enrollmentItems.push(item);
    } else {
      courseItems.push(item);
    }
  });
  
  return { courseItems, enrollmentItems };
}
