
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/hooks/invoices/types";
import { format } from "date-fns";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoiceSummary } from "./InvoiceSummary";

interface InvoiceDetailsPanelProps {
  invoice: Invoice;
}

export function InvoiceDetailsPanel({ invoice }: InvoiceDetailsPanelProps) {
  // Log invoice data for debugging purposes
  console.log("Rendering InvoiceDetailsPanel with invoice:", invoice);
  console.log("Client data in invoice:", invoice.client);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>Invoice Details</CardTitle>
        <InvoiceStatusBadge status={invoice.status} />
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Issued on {format(new Date(invoice.issued_date), "dd/MM/yyyy")}
          </p>
        </div>
        
        {/* Client information */}
        {invoice.client && (
          <div className="mb-6 p-3 bg-gray-50 rounded-md border">
            <h3 className="text-sm font-medium mb-1">Bill To:</h3>
            <p className="text-sm">{invoice.client.first_name} {invoice.client.last_name}</p>
            <p className="text-sm text-gray-600">{invoice.client.email}</p>
            {invoice.client.phone && <p className="text-sm text-gray-600">{invoice.client.phone}</p>}
          </div>
        )}
        
        <InvoiceItemsTable items={invoice.items || []} />
        
        <InvoiceSummary invoice={invoice} />
        
        {invoice.notes && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Notes:</h3>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
