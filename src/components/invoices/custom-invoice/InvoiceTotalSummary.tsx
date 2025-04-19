
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
    const discountInput = Number(form.getValues("discount_amount") || 0);
    
    // Calculate the actual discount value in currency
    let discountValue = 0;
    
    if (discountType === "percentage") {
      // For percentage, convert percentage to actual currency amount
      discountValue = subtotal * (discountInput / 100);
    } else {
      // For fixed amount, use the input directly
      discountValue = discountInput;
    }
    
    // Ensure discount doesn't exceed subtotal
    discountValue = Math.min(discountValue, subtotal);
    
    // Calculate tax on the amount after discount
    const taxRate = Number(form.getValues("tax_rate") || 0);
    const taxable = subtotal - discountValue;
    const tax = taxable * (taxRate / 100);
    
    return {
      subtotal: subtotal,
      discountType,
      discountInput,
      discountValue,
      taxRate,
      tax: tax,
      total: subtotal - discountValue + tax
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
      
      {totals.discountValue > 0 && (
        <div className="flex justify-between text-sm text-red-600">
          <span>
            Discount {discountType === "percentage" ? 
              `(${discountAmount}%)` : // Show the original percentage input 
              ""}
          </span>
          <span>-{formatCurrency(totals.discountValue)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Tax ({form.getValues("tax_rate")}%)</span>
        <span>{formatCurrency(totals.tax)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>{formatCurrency(totals.total)}</span>
      </div>
    </div>
  );
}
