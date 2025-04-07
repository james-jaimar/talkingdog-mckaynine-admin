
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";
import { AlertCircle } from "lucide-react";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  // Check if there are any items to display
  if (!items || items.length === 0) {
    return <div className="py-6 px-4 text-center bg-amber-50 rounded-md border border-amber-200">
      <div className="flex items-center justify-center mb-2">
        <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
        <p className="font-medium text-amber-700">No items found on this invoice</p>
      </div>
      <p className="text-sm text-amber-600">
        This invoice doesn't have any line items. If you created this invoice from a class booking,
        there might be an issue with the data connection. Try refreshing or check the invoice creation process.
      </p>
    </div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            // Extract booking-related information if available
            const booking = item.bookings;
            const classData = booking?.class_schedules?.classes;
            const dogName = booking?.dogs?.name;
            
            return (
              <TableRow key={item.id || `item-${index}`}>
                <TableCell className="py-4">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    {(booking || dogName || classData) && (
                      <p className="text-xs text-gray-500">
                        {dogName && <span>Dog: {dogName} </span>}
                        {dogName && classData && <span>| </span>}
                        {classData && <span>Class: {classData.name}</span>}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.amount || (item.quantity * item.unit_price))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
