
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { Invoice } from "@/hooks/invoices/types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoiceSummary } from "./InvoiceSummary";

interface InvoiceDetailsPanelProps {
  invoice: Invoice;
}

export function InvoiceDetailsPanel({ invoice }: InvoiceDetailsPanelProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Invoice Details</h3>
            <div className="space-y-1 mt-2">
              <p className="text-sm flex justify-between">
                <span>Invoice Number:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </p>
              <p className="text-sm flex justify-between">
                <span>Issue Date:</span>
                <span className="font-medium">{format(new Date(invoice.issued_date), "MMMM d, yyyy")}</span>
              </p>
              <p className="text-sm flex justify-between">
                <span>Due Date:</span>
                <span className="font-medium">{format(new Date(invoice.due_date), "MMMM d, yyyy")}</span>
              </p>
              <p className="text-sm flex justify-between">
                <span>Status:</span>
                <span><InvoiceStatusBadge status={invoice.status} /></span>
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Payment Details</h3>
            <div className="space-y-1 mt-2">
              <InvoiceSummary invoice={invoice} />
            </div>
          </div>
        </div>
        
        {invoice.discount_reason && (
          <div className="mt-2">
            <h3 className="font-medium text-sm text-muted-foreground">Discount Reason</h3>
            <p className="text-sm mt-1 p-2 bg-muted/50 rounded-md">{invoice.discount_reason}</p>
          </div>
        )}

        {invoice.notes && (
          <div className="mt-2">
            <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
            <p className="text-sm mt-1 p-2 bg-muted/50 rounded-md">{invoice.notes}</p>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="font-medium text-base mb-3">Items</h3>
          <InvoiceItemsTable items={invoice.items} />
        </div>
      </CardContent>
    </Card>
  );
}
