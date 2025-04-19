
import { useFormContext } from "react-hook-form";
import { formatCurrency } from "@/lib/formatters";
import { FormValues } from "./InvoiceFormProvider";

export function InvoiceTotalSummary() {
  const form = useFormContext<FormValues>();

  // Calculate the total amount
  const calculateTotal = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
    
    // Get discount details
    const discountType = form.getValues("discount_type");
    const discountValue = Number(form.getValues("discount_amount") || 0);
    
    // Calculate the actual discount amount in currency
    let monetaryDiscount = 0;
    
    if (discountType === "percentage") {
      monetaryDiscount = subtotal * (discountValue / 100);
    } else {
      monetaryDiscount = Math.min(discountValue, subtotal);
    }
    
    // Calculate tax on the amount after discount
    const taxRate = Number(form.getValues("tax_rate") || 0);
    const taxableAmount = subtotal - monetaryDiscount;
    const tax = taxableAmount * (taxRate / 100);
    
    return {
      subtotal,
      discountType,
      discountValue,
      monetaryDiscount,
      taxRate,
      tax,
      total: subtotal - monetaryDiscount + tax
    };
  };

  const totals = calculateTotal();
  const discountType = form.watch("discount_type");
  const discountAmount = form.watch("discount_amount");

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
