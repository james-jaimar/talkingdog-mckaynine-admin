
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
    const discountAmount = form.getValues("discount_amount") || 0;
    
    // Calculate the actual discount value
    let actualDiscount = discountAmount;
    if (discountType === "percentage") {
      actualDiscount = subtotal * (discountAmount / 100);
    }
    
    const taxRate = form.getValues("tax_rate") || 0;
    const tax = (subtotal - actualDiscount) * (taxRate / 100);
    
    return {
      subtotal: subtotal.toFixed(2),
      discount: actualDiscount.toFixed(2),
      discountType,
      discountAmount,
      tax: tax.toFixed(2),
      total: (subtotal - actualDiscount + tax).toFixed(2)
    };
  };

  const totals = calculateTotal();
  const discountType = form.watch("discount_type");
  const discountAmount = form.watch("discount_amount");

  return (
    <div className="border-t pt-4 space-y-1">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatCurrency(parseFloat(totals.subtotal))}</span>
      </div>
      
      {parseFloat(totals.discount) > 0 && (
        <div className="flex justify-between text-sm text-red-600">
          <span>
            Discount {discountType === "percentage" ? 
              `(${discountAmount}%)` : 
              ""}
          </span>
          <span>-{formatCurrency(parseFloat(totals.discount))}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Tax ({form.getValues("tax_rate")}%)</span>
        <span>{formatCurrency(parseFloat(totals.tax))}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>{formatCurrency(parseFloat(totals.total))}</span>
      </div>
    </div>
  );
}
