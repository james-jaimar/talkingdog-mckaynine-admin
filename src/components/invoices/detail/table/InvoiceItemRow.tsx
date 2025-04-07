
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
  let dogName = booking?.dogs?.name;
  
  // Parse description for class name and dog name if it's included in the format "Class Name - Dog Name"
  let displayDescription = item.description || 'Training services';
  let className = classData?.name;
  
  // If the description includes a dog name in the format "Class - Dog"
  if (displayDescription.includes(" - ") && !dogName) {
    const parts = displayDescription.split(" - ");
    if (parts.length >= 2) {
      className = parts[0];
      dogName = parts[1];
      console.log(`Parsed from description - Class: ${className}, Dog: ${dogName}`);
    }
  }
  
  // If class name wasn't found in the description but is available from booking data
  if (!className && classData) {
    className = classData.name;
  }
  
  // Determine what to show as the primary description
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
