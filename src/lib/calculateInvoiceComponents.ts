
/**
 * Canonical Helper to calculate invoice, discount, and expense breakdowns.
 * Used absolutely everywhere for invoicing calculations.
 * 
 * @param courseFee Number - main course price (not including enrollment fee)
 * @param enrollmentFee Number - only applied if >0
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
  enrollmentFee = 0,
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
  // Validate and sanitize inputs to prevent NaN errors
  if (typeof courseFee !== "number" || isNaN(courseFee)) courseFee = 0;
  if (typeof enrollmentFee !== "number" || isNaN(enrollmentFee)) enrollmentFee = 0;
  if (typeof discount !== "number" || isNaN(discount)) discount = 0;
  if (typeof adminFeeRate !== "number" || isNaN(adminFeeRate)) adminFeeRate = 0;
  if (typeof trainerFeeRate !== "number" || isNaN(trainerFeeRate)) trainerFeeRate = 0;
  if (typeof franchiseFeeRate !== "number" || isNaN(franchiseFeeRate)) franchiseFeeRate = 0;

  // Calculate subtotal (course fee + enrollment fee)
  const subtotal = Number(courseFee) + Number(enrollmentFee);

  // DEV LOG: Confirm that input args are clean and explicit
  console.log("CALC-INVOICE breakdown inputs:", {
    courseFee, enrollmentFee, discount, discountType, adminFeeRate, trainerFeeRate, franchiseFeeRate
  });

  // Calculate monetary discount based on discount type
  let monetaryDiscount = 0;
  if (discountType === "percentage") {
    monetaryDiscount = subtotal * Math.min(Math.max(discount, 0), 100) / 100;
  } else {
    monetaryDiscount = Math.min(Number(discount || 0), subtotal);
  }

  // Calculate total after discount
  const total = subtotal - monetaryDiscount;

  // Calculate expense breakdowns (for accounting only)
  const adminFee = total * (adminFeeRate / 100);
  const trainerFee = total * (trainerFeeRate / 100);
  const franchiseFee = total * (franchiseFeeRate / 100);

  // Log the final calculations for debugging
  console.log("CALC-INVOICE final results:", {
    subtotal,
    monetaryDiscount,
    total,
    adminFee,
    trainerFee,
    franchiseFee
  });

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
