
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/hooks/invoices/types";
import { format } from "date-fns";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoiceSummary } from "./InvoiceSummary";
import { AlertCircle } from "lucide-react";

interface InvoiceDetailsPanelProps {
  invoice: Invoice;
}

export function InvoiceDetailsPanel({ invoice }: InvoiceDetailsPanelProps) {
  // Log invoice data for debugging purposes
  console.log("Rendering InvoiceDetailsPanel with invoice:", invoice);
  console.log("Client data in invoice:", invoice.client);
  
  // Check if any item has booking-related class information
  const hasClassBookings = invoice.items?.some(item => 
    item.bookings?.class_schedules?.classes?.name
  );
  
  // Debug log class booking status
  console.log("Invoice has class bookings:", hasClassBookings);
  
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
          <p className="text-sm text-muted-foreground">
            Due on {format(new Date(invoice.due_date), "dd/MM/yyyy")}
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
        
        {/* Show class booking alert if this invoice is for classes but missing data */}
        {invoice.notes?.toLowerCase().includes('booking') && 
         !hasClassBookings && 
         invoice.items && 
         invoice.items.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700">
                This invoice appears to be for class bookings, but full class details couldn't be retrieved.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Invoice items will show the available information.
              </p>
            </div>
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
