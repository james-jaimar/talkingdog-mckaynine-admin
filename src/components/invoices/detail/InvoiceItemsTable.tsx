
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

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  // Check if there are any items to display
  if (!items || items.length === 0) {
    return <div className="py-4 text-center bg-gray-50 rounded-md">
      <p className="text-gray-500">No items found on this invoice. There might be a database permission issue or the invoice items haven't been added yet.</p>
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
                    <p className="font-medium">{item.description || "Class booking"}</p>
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
