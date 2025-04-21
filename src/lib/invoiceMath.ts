
/**
 * Canonical calculation utility for all invoice totals math.
 * Always returns: subtotal (from items), tax, final total, and the true monetary discount,
 * based on the discount type/value (ZAR or %).
 */
export interface InvoiceItemInput {
  quantity: number;
  unit_price: number;
}

export type DiscountType = "fixed" | "percentage";

export function calculateInvoiceTotals({
  items,
  discountType,
  discountAmount,
  taxRate
}: {
  items: InvoiceItemInput[];
  discountType: DiscountType;
  discountAmount: number;
  taxRate: number;
}) {
  const subtotal = items.reduce(
    (sum, item) =>
      (item?.quantity && item?.unit_price)
        ? sum + item.quantity * item.unit_price
        : sum,
    0
  );

  let monetaryDiscount = 0;
  // discountType === 'percentage' means discountAmount is PERCENT not ZAR
  if (discountType === "percentage") {
    monetaryDiscount = subtotal * ((discountAmount || 0) / 100);
  } else {
    monetaryDiscount = Math.min(discountAmount || 0, subtotal);
  }

  const taxableAmount = subtotal - monetaryDiscount;
  const tax = taxableAmount * ((taxRate || 0) / 100);
  const total = taxableAmount + tax;

  return {
    subtotal,
    monetaryDiscount,
    discountType,
    discountAmount: discountAmount || 0,
    taxRate: taxRate || 0,
    tax,
    total
  };
}
