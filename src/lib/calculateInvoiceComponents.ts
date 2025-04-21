
/**
 * Helper to calculate invoice, discount, and expense breakdowns.
 * 
 * @param courseFee Number - main course price or subtotal
 * @param enrollmentFee Number - only applied on first class
 * @param discount Amount (number) - discount value
 * @param discountType "fixed" | "percentage"
 * @param adminFeeRate Number (as percentage, default 0)
 * @param trainerFeeRate Number (as percentage, default 0)
 * @param franchiseFeeRate Number (as percentage, default 0)
 * @returns InvoiceCalculationResult
 */
export interface InvoiceCalculationResult {
  subtotal: number;
  monetaryDiscount: number;
  discountType: "fixed" | "percentage";
  discountAmount: number;
  total: number;
  adminFee: number;
  trainerFee: number;
  franchiseFee: number;
  expenseBreakdown: {
    adminFee: number;
    trainerFee: number;
    franchiseFee: number;
  }
}

export function calculateInvoiceComponents({
  courseFee,
  enrollmentFee,
  discount = 0,
  discountType = "fixed",
  adminFeeRate = 0,
  trainerFeeRate = 0,
  franchiseFeeRate = 0,
}: {
  courseFee: number;
  enrollmentFee?: number;
  discount?: number;
  discountType?: "fixed" | "percentage";
  adminFeeRate?: number;
  trainerFeeRate?: number;
  franchiseFeeRate?: number;
}): InvoiceCalculationResult {
  const subtotal = Number(courseFee || 0) + Number(enrollmentFee || 0);

  let monetaryDiscount = 0;
  if (discountType === "percentage") {
    monetaryDiscount = subtotal * Math.min(Math.max(discount, 0), 100) / 100;
  } else {
    monetaryDiscount = Math.min(Number(discount || 0), subtotal);
  }

  const total = subtotal - monetaryDiscount;

  // Expense breakdowns (for accounting only)
  const adminFee = total * (adminFeeRate / 100);
  const trainerFee = total * (trainerFeeRate / 100);
  const franchiseFee = total * (franchiseFeeRate / 100);

  return {
    subtotal,
    monetaryDiscount,
    discountType,
    discountAmount: discount,
    total,
    adminFee,
    trainerFee,
    franchiseFee,
    expenseBreakdown: {
      adminFee,
      trainerFee,
      franchiseFee,
    }
  };
}
