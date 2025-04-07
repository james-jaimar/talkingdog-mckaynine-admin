
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
  
  // Get dog information
  let dogName = booking?.dogs?.name;
  
  // Get class information
  let className = booking?.class_schedules?.classes?.name;
  
  // Parse description for class name and dog name if no booking data
  let displayDescription = item.description || 'Training services';
  
  // If we don't have a dog name or class name from booking, try to extract from description
  if (!dogName || !className) {
    if (displayDescription.includes(" - ")) {
      const parts = displayDescription.split(" - ");
      if (parts.length >= 2) {
        if (!className) className = parts[0];
        if (!dogName) dogName = parts[1];
        console.log(`Parsed from description - Class: ${className}, Dog: ${dogName}`);
      }
    }
  }
  
  // Build primary description
  const primaryDescription = className || displayDescription.split(" - ")[0] || 'Training services';
  
  return (
    <TableRow key={item.id || `item-${index}`}>
      <TableCell className="py-4">
        <div>
          <p className="font-medium">{primaryDescription}</p>
          {dogName && (
            <p className="text-xs text-gray-500">
              Dog: {dogName}
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
