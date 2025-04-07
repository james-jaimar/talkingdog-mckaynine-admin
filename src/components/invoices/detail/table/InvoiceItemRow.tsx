
import { TableCell, TableRow } from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  index: number;
}

export function InvoiceItemRow({ item, index }: InvoiceItemRowProps) {
  console.log(`Rendering invoice item row for item:`, item);
  
  // Extract booking-related information if available
  const booking = item.bookings;
  
  // Get dog information
  const dogName = booking?.dogs?.name;
  
  // Get class information
  const className = booking?.class_schedules?.classes?.name;
  
  // Parse description for class name and dog name if no booking data
  const displayDescription = item.description || 'Training services';
  
  // Build primary description
  let primaryDescription = displayDescription;
  let secondaryDescription = null;

  if (booking) {
    primaryDescription = className || displayDescription;
    secondaryDescription = dogName ? `Dog: ${dogName}` : null;
  } else if (displayDescription.includes(" - ")) {
    // If no booking but description has format "Class - Dog"
    const parts = displayDescription.split(" - ");
    primaryDescription = parts[0];
    secondaryDescription = parts.length > 1 ? `Dog: ${parts[1]}` : null;
  }
  
  // Debug logging
  console.log(`Item ${index} display details:`, {
    primaryDescription,
    secondaryDescription,
    booking_data: !!booking,
    item_description: displayDescription
  });
  
  return (
    <TableRow key={item.id || `item-${index}`}>
      <TableCell className="py-4">
        <div>
          <p className="font-medium">{primaryDescription}</p>
          {secondaryDescription && (
            <p className="text-xs text-gray-500">
              {secondaryDescription}
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
