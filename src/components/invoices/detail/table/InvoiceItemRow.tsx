
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
  
  // Parse description for dog name if it's included in the format "Class Name - Dog Name"
  let displayDescription = item.description;
  let displayDogName = dogName;
  
  // If the description includes a dog name in the format "Class - Dog"
  if (item.description.includes(" - ") && !displayDogName) {
    const parts = item.description.split(" - ");
    if (parts.length >= 2) {
      displayDescription = parts[0];
      displayDogName = parts[1];
    }
  }
  
  return (
    <TableRow key={item.id || `item-${index}`}>
      <TableCell className="py-4">
        <div>
          <p className="font-medium">{displayDescription}</p>
          {(displayDogName || classData) && (
            <p className="text-xs text-gray-500">
              {displayDogName && <span>Dog: {displayDogName} </span>}
              {displayDogName && classData && <span>| </span>}
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
