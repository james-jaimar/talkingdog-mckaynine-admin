/**
 * Utility functions for working with invoice items
 * Specifically for identifying and filtering enrollment fees from course fees
 */

export interface InvoiceItemLike {
  description?: string;
  item_type?: string;
  amount?: number;
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
