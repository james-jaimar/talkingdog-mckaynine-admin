
import { useFormContext, useWatch } from "react-hook-form";
import { formatCurrency } from "@/lib/formatters";
import { FormValues } from "./InvoiceFormProvider";
import { calculateInvoiceTotals } from "@/lib/invoiceMath";

export function InvoiceTotalSummary() {
  const form = useFormContext<FormValues>();
  // Watch for changes in items, discount type, discount amount, and tax rate
  const items = useWatch({ control: form.control, name: "items" });
  const discountType = useWatch({ control: form.control, name: "discount_type" });
  const discountAmount = useWatch({ control: form.control, name: "discount_amount" });
  const taxRate = useWatch({ control: form.control, name: "tax_rate" });

  // Calculate the total using the new central utility
  const totals = calculateInvoiceTotals({
    items: items || [],
    discountType: discountType || "fixed",
    discountAmount: discountAmount || 0,
    taxRate: taxRate || 0,
  });

  return (
    <div className="border-t pt-4 space-y-1">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatCurrency(totals.subtotal)}</span>
      </div>
      
      {totals.monetaryDiscount > 0 && (
        <div className="flex justify-between text-sm text-red-600">
          <span className="flex items-center">
            Discount {totals.discountType === "percentage" ? `(${totals.discountAmount}%)` : "(Fixed)"}
          </span>
          <span>-{formatCurrency(totals.monetaryDiscount)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Tax ({totals.taxRate}%)</span>
        <span>{formatCurrency(totals.tax)}</span>
      </div>
      
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>{formatCurrency(totals.total)}</span>
      </div>
    </div>
  );
}
