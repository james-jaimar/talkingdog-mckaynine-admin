import { Invoice } from "@/types/invoice";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceDetailsPanelProps {
  invoice: Invoice;
}

export function InvoiceDetailsPanel({ invoice }: InvoiceDetailsPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-lg">Invoice Details</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Invoice Number:</span>
            <span className="font-medium">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Issue Date:</span>
            <span className="font-medium">{format(new Date(invoice.issued_date), "PP")}</span>
          </div>
          <div className="flex justify-between">
            <span>Due Date:</span>
            <span className="font-medium">{format(new Date(invoice.due_date), "PP")}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-medium">{invoice.status}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-lg">Payment Details</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({invoice.tax_rate}%):</span>
            <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="font-medium">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>
  
      {invoice.discount_amount > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Discount Details</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-medium">
                {invoice.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium text-red-600">
                {invoice.discount_type === 'percentage' 
                  ? `${invoice.discount_amount}%`
                  : `ZAR ${invoice.discount_amount.toFixed(2)}`}
              </span>
            </div>
            {invoice.discount_reason && (
              <div className="flex justify-between">
                <span>Reason:</span>
                <span className="font-medium">{invoice.discount_reason}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {invoice.notes && (
        <div>
          <h3 className="font-medium text-lg">Notes</h3>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
