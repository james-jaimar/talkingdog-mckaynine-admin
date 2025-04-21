
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
  // Safeguard against invalid inputs with defaults
  const safeItems = items || [];
  const safeDiscountType = discountType || "fixed";
  const safeDiscountAmount = Number(discountAmount || 0);
  const safeTaxRate = Number(taxRate || 0);

  // Calculate subtotal with safe handling of nulls
  const subtotal = safeItems.reduce(
    (sum, item) => {
      // Check for valid quantity and price, or default to zero contribution
      const quantity = Number(item?.quantity || 0);
      const unitPrice = Number(item?.unit_price || 0);
      return sum + (quantity * unitPrice);
    },
    0
  );

  // Enhanced logging for debugging
  console.log(`Invoice Math: Raw subtotal calculated as ${subtotal} from ${safeItems.length} items`);

  let monetaryDiscount = 0;
  // discountType === 'percentage' means discountAmount is PERCENT not ZAR
  if (safeDiscountType === "percentage") {
    // Ensure percentage is correctly applied (0-100%)
    const percentageRate = Math.min(Math.max(safeDiscountAmount, 0), 100) / 100;
    monetaryDiscount = subtotal * percentageRate;
    console.log(`Invoice Math: Percentage discount ${safeDiscountAmount}% = ${monetaryDiscount} ZAR`);
  } else {
    // For fixed discount, ensure we don't discount more than the subtotal
    monetaryDiscount = Math.min(safeDiscountAmount, subtotal);
    console.log(`Invoice Math: Fixed discount ${monetaryDiscount} ZAR (capped at subtotal)`);
  }

  const taxableAmount = subtotal - monetaryDiscount;
  const tax = taxableAmount * (safeTaxRate / 100);
  const total = taxableAmount + tax;

  console.log(`Invoice Math: Final calculation:
    - Subtotal: ${subtotal}
    - Discount: ${monetaryDiscount} (${safeDiscountType})
    - Taxable amount: ${taxableAmount}
    - Tax (${safeTaxRate}%): ${tax}
    - Total: ${total}`);

  return {
    subtotal,
    monetaryDiscount,
    discountType: safeDiscountType,
    discountAmount: safeDiscountAmount,
    taxRate: safeTaxRate,
    tax,
    total
  };
}
