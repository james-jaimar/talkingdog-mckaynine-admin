
/**
 * Utility for calculating invoice totals from invoice items
 */

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
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  // Calculate discount
  let monetaryDiscount = 0;
  if (discountType === 'percentage') {
    monetaryDiscount = subtotal * (discountAmount / 100);
  } else {
    monetaryDiscount = Math.min(discountAmount, subtotal); // Don't allow negative totals
  }

  // Calculate tax (applied after discount)
  const taxableAmount = subtotal - monetaryDiscount;
  const tax = taxableAmount * (taxRate / 100);

  // Calculate final total
  const total = taxableAmount + tax;

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
