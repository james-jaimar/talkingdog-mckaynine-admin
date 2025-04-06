
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
    const taxRate = form.getValues("tax_rate") || 0;
    const tax = subtotal * (taxRate / 100);
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2)
    };
  };

  const totals = calculateTotal();

  return (
    <div className="border-t pt-4 space-y-1">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatCurrency(parseFloat(totals.subtotal))}</span>
      </div>
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
