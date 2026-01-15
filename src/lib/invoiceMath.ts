/**
 * Utility for calculating invoice totals from invoice items
 * 
 * All monetary values are rounded to cents for consistency across
 * invoice creation, display, PDF generation, and financial reports.
 */

/**
 * Round a number to the nearest cent (2 decimal places)
 * This is the single source of truth for currency rounding in the system.
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

interface InvoiceItem {
  quantity: number;
  unit_price: number;
}

interface InvoiceTotalParams {
  items: InvoiceItem[];
  discountType: 'fixed' | 'percentage';
  discountAmount: number;
  taxRate: number;
}

export function calculateInvoiceTotals({ 
  items, 
  discountType = 'fixed',
  discountAmount = 0,
  taxRate = 0
}: InvoiceTotalParams) {
  // Calculate subtotal from items (rounded to cents)
  const subtotal = roundToCents(items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0));

  // Calculate discount (rounded to cents)
  let monetaryDiscount = 0;
  if (discountType === 'percentage') {
    monetaryDiscount = roundToCents(subtotal * (discountAmount / 100));
  } else {
    // For fixed discount, clamp to subtotal to prevent negative totals
    monetaryDiscount = roundToCents(Math.min(discountAmount, subtotal));
  }

  // Calculate tax (applied after discount, rounded to cents)
  const taxableAmount = roundToCents(subtotal - monetaryDiscount);
  const tax = roundToCents(taxableAmount * (taxRate / 100));

  // Calculate final total (rounded to cents)
  const total = roundToCents(taxableAmount + tax);

  return {
    subtotal,
    discountType,
    discountAmount,
    monetaryDiscount,
    taxRate,
    tax,
    total
  };
}
