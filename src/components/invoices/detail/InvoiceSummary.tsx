
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  return (
    <div className="flex justify-end mt-4">
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax ({invoice.tax_rate}%):</span>
          <span>{formatCurrency(invoice.tax_amount)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span>{formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </div>
  );
}
