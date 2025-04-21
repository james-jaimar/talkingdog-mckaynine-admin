
import { useFormContext, useWatch } from "react-hook-form";
import { formatCurrency } from "@/lib/formatters";
import { FormValues } from "./InvoiceFormProvider";
import { useMemo } from "react";

export function InvoiceTotalSummary() {
  const form = useFormContext<FormValues>();
  
  // Watch for changes in items, discount type, discount amount, and tax rate
  const items = useWatch({ control: form.control, name: "items" });
  const discountType = useWatch({ control: form.control, name: "discount_type" });
  const discountAmount = useWatch({ control: form.control, name: "discount_amount" });
  const taxRate = useWatch({ control: form.control, name: "tax_rate" });

  // Calculate the total amount using useMemo to prevent unnecessary recalculations
  const totals = useMemo(() => {
    // Calculate subtotal as sum of quantity * unit_price for all items
    const subtotal = items.reduce((total, item) => {
      const itemAmount = (item.quantity || 0) * (item.unit_price || 0);
      return total + itemAmount;
    }, 0);
    
    // Calculate discount based on type
    let monetaryDiscount = 0;
    if (discountType === "percentage") {
      monetaryDiscount = subtotal * (Number(discountAmount) / 100);
    } else {
      monetaryDiscount = Math.min(Number(discountAmount) || 0, subtotal);
    }
    
    // Calculate tax on the amount after discount
    const taxableAmount = subtotal - monetaryDiscount;
    const tax = taxableAmount * (Number(taxRate) / 100);
    
    // Calculate final total
    const total = subtotal - monetaryDiscount + tax;
    
    return {
      subtotal,
      discountType,
      discountAmount: Number(discountAmount) || 0,
      monetaryDiscount,
      taxRate: Number(taxRate) || 0,
      tax,
      total
    };
  }, [items, discountType, discountAmount, taxRate]);

  return (
    <div className="border-t pt-4 space-y-1">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatCurrency(totals.subtotal)}</span>
      </div>
      
      {totals.monetaryDiscount > 0 && (
        <div className="flex justify-between text-sm text-red-600">
          <span className="flex items-center">
            Discount {discountType === "percentage" ? `(${discountAmount}%)` : "(Fixed)"}
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
