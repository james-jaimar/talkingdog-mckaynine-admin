
import { TableCell, TableRow } from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  index: number;
}

export function InvoiceItemRow({ item, index }: InvoiceItemRowProps) {
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
}
