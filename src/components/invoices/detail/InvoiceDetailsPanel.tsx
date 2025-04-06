
import { Invoice } from "@/hooks/invoices/types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoiceSummary } from "./InvoiceSummary";
import { formatDate } from "@/lib/formatters";

interface InvoiceDetailsPanelProps {
  invoice: Invoice;
}

export function InvoiceDetailsPanel({ invoice }: InvoiceDetailsPanelProps) {
  return (
    <div className="bg-white p-6 rounded-md shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">Invoice Details</h2>
          <p className="text-gray-500">
            Issued on {formatDate(invoice.issued_date)}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {invoice.items && invoice.items.length > 0 ? (
        <InvoiceItemsTable items={invoice.items} />
      ) : (
        <p className="py-4 text-gray-500">No items on this invoice</p>
      )}

      <InvoiceSummary invoice={invoice} />

      {invoice.notes && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Notes:</h3>
          <p className="text-gray-700">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
