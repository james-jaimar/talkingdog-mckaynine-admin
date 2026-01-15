/**
 * Utility functions for working with invoice items
 * Specifically for identifying and filtering enrollment fees from course fees
 * 
 * IMPORTANT: All discount calculations use cents-based rounding to prevent drift.
 */

import { roundToCents } from './invoiceMath';

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
 * Enhanced result type that preserves original item properties plus net_amount
 */
export interface DiscountedInvoiceItem {
  amount: number;          // Original amount
  net_amount: number;      // Amount after invoice-level discount
  description?: string;
  item_type?: string;
  invoice_id?: string;
  booking_id?: string;
  id?: string;
}

/**
 * Apply invoice-level discount proportionally to invoice items
 * 
 * This version uses a precise cents-based algorithm to prevent rounding drift:
 * 1. Calculate each item's share of the discount in cents
 * 2. Track accumulated rounding error
 * 3. Adjust the final item to ensure sum(net_amounts) === subtotal - monetary_discount
 * 
 * Returns items with both original 'amount' and discounted 'net_amount'
 */
export function applyInvoiceDiscountToItems<T extends InvoiceItemWithDiscount & { id?: string; invoice_id?: string; booking_id?: string }>(
  items: T[]
): DiscountedInvoiceItem[] {
  if (!items || items.length === 0) return [];
  
  // Group items by invoice to apply discount per-invoice
  const itemsByInvoice = new Map<string, T[]>();
  const noInvoiceItems: T[] = [];
  
  items.forEach(item => {
    const invoiceKey = item.invoices ? JSON.stringify({
      subtotal: item.invoices.subtotal,
      monetary_discount: item.invoices.monetary_discount
    }) : null;
    
    if (!invoiceKey || !item.invoices) {
      noInvoiceItems.push(item);
    } else {
      if (!itemsByInvoice.has(invoiceKey)) {
        itemsByInvoice.set(invoiceKey, []);
      }
      itemsByInvoice.get(invoiceKey)!.push(item);
    }
  });
  
  const result: DiscountedInvoiceItem[] = [];
  
  // Process items without invoice data (no discount applied)
  noInvoiceItems.forEach(item => {
    const originalAmount = item.amount || 0;
    result.push({
      amount: originalAmount,
      net_amount: originalAmount,
      description: item.description,
      item_type: item.item_type,
      id: item.id,
      invoice_id: item.invoice_id,
      booking_id: item.booking_id
    });
  });
  
  // Process items grouped by invoice
  itemsByInvoice.forEach((invoiceItems) => {
    const invoice = invoiceItems[0].invoices!;
    const subtotal = invoice.subtotal || 0;
    const monetaryDiscount = invoice.monetary_discount || 0;
    
    // If no discount or invalid subtotal, keep original amounts
    if (monetaryDiscount <= 0 || subtotal <= 0) {
      invoiceItems.forEach(item => {
        const originalAmount = item.amount || 0;
        result.push({
          amount: originalAmount,
          net_amount: originalAmount,
          description: item.description,
          item_type: item.item_type,
          id: item.id,
          invoice_id: item.invoice_id,
          booking_id: item.booking_id
        });
      });
      return;
    }
    
    // Calculate target net total (what the sum of net_amounts should be)
    const targetNetTotal = roundToCents(subtotal - monetaryDiscount);
    const discountRatio = monetaryDiscount / subtotal;
    
    // Calculate net amounts using cents-based algorithm
    let accumulatedNet = 0;
    const processedItems: DiscountedInvoiceItem[] = [];
    
    invoiceItems.forEach((item, index) => {
      const originalAmount = item.amount || 0;
      const isLast = index === invoiceItems.length - 1;
      
      let netAmount: number;
      if (isLast) {
        // Last item gets the remainder to ensure exact sum
        netAmount = roundToCents(targetNetTotal - accumulatedNet);
        // Ensure non-negative
        netAmount = Math.max(0, netAmount);
      } else {
        // Apply proportional discount
        const itemDiscount = originalAmount * discountRatio;
        netAmount = roundToCents(originalAmount - itemDiscount);
        accumulatedNet += netAmount;
      }
      
      processedItems.push({
        amount: originalAmount,
        net_amount: netAmount,
        description: item.description,
        item_type: item.item_type,
        id: item.id,
        invoice_id: item.invoice_id,
        booking_id: item.booking_id
      });
    });
    
    result.push(...processedItems);
  });
  
  return result;
}

/**
 * Get the course fee amount from a list of invoice items
 * Excludes enrollment fees which are pass-through to the franchise owner
 * 
 * @param items - Items with 'amount' or 'net_amount' property
 * @param useNetAmount - If true, use net_amount (after discount); otherwise use amount
 */
export function getCourseFeeAmount(items: (InvoiceItemLike & { net_amount?: number })[], useNetAmount = true): number {
  return roundToCents(items
    .filter(item => !isEnrollmentFeeItem(item))
    .reduce((sum, item) => {
      const value = useNetAmount && 'net_amount' in item ? item.net_amount : item.amount;
      return sum + (value || 0);
    }, 0));
}

/**
 * Get the enrollment fee amount from a list of invoice items
 * 
 * @param items - Items with 'amount' or 'net_amount' property  
 * @param useNetAmount - If true, use net_amount (after discount); otherwise use amount
 */
export function getEnrollmentFeeAmount(items: (InvoiceItemLike & { net_amount?: number })[], useNetAmount = true): number {
  return roundToCents(items
    .filter(item => isEnrollmentFeeItem(item))
    .reduce((sum, item) => {
      const value = useNetAmount && 'net_amount' in item ? item.net_amount : item.amount;
      return sum + (value || 0);
    }, 0));
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
