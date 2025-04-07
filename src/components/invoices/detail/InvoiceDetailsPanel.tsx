
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/hooks/invoices/types";
import { format } from "date-fns";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoiceSummary } from "./InvoiceSummary";
import { AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InvoiceDetailsPanelProps {
  invoice: Invoice;
}

export function InvoiceDetailsPanel({ invoice }: InvoiceDetailsPanelProps) {
  // Log invoice data for debugging purposes
  console.log("Rendering InvoiceDetailsPanel with invoice:", invoice);
  
  // Check if any item has booking-related class information
  const hasBookingItems = invoice.items?.some(item => item.booking_id);
  
  // Check if any item has complete booking data with class info
  const hasClassBookings = invoice.items?.some(item => 
    item.bookings?.class_schedules?.classes?.name
  );
  
  // Check if invoice appears to be for a class booking based on notes or items
  const isLikelyClassBooking = 
    (invoice.notes?.toLowerCase().includes('booking') || 
     invoice.notes?.toLowerCase().includes('class')) ||
    hasBookingItems;
  
  // Debug log booking status
  console.log("Invoice details:", {
    hasBookingItems,
    hasClassBookings,
    isLikelyClassBooking,
    itemsCount: invoice.items?.length || 0
  });
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-muted-foreground" /> 
          Invoice Details
        </CardTitle>
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
        {isLikelyClassBooking && !hasClassBookings && hasBookingItems && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">Class booking information</AlertTitle>
            <AlertDescription className="text-blue-600 text-sm">
              This invoice appears to be for class bookings, but some class details couldn't be fully retrieved.
              Basic booking information is shown where available.
            </AlertDescription>
          </Alert>
        )}
        
        <InvoiceItemsTable items={invoice.items || []} />
        
        <InvoiceSummary invoice={invoice} />
        
        {invoice.notes && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Notes:</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
