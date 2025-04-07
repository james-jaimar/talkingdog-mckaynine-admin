
import { TableCell, TableRow } from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  index: number;
}

export function InvoiceItemRow({ item, index }: InvoiceItemRowProps) {
  console.log(`Rendering invoice item row for item:`, item);
  
  // Extract booking-related information
  const booking = item.bookings;
  
  // Get class information
  const classInfo = booking?.class_schedules?.classes;
  const className = classInfo?.name;
  
  // Get dog information
  const dogName = booking?.dogs?.name;
  
  // Build display description
  let primaryDescription = item.description || 'Training services';
  let classDescription = className || null;
  let dogDescription = dogName ? `Dog: ${dogName}` : null;
  
  // If description contains class and dog info already (format: "Class - Dog")
  if (item.description && item.description.includes(' - ')) {
    const parts = item.description.split(' - ');
    if (parts.length >= 2) {
      primaryDescription = parts[0];
      dogDescription = `Dog: ${parts[1]}`;
    }
  } 
  // If there's booking data but no structured description
  else if (booking) {
    if (className) {
      // Use class name as primary if available
      primaryDescription = className;
      // Only set the description if we have the dog name
      if (dogName) {
        dogDescription = `Dog: ${dogName}`;
      }
    }
  }
  
  // Debug logging
  console.log(`Item ${index} display details:`, {
    primaryDescription,
    classDescription,
    dogDescription,
    booking_data: !!booking,
    has_class_info: !!classInfo
  });
  
  return (
    <TableRow>
      <TableCell className="py-4">
        <div>
          <p className="font-medium">{primaryDescription}</p>
          {dogDescription && (
            <p className="text-xs text-gray-500">
              {dogDescription}
            </p>
          )}
          {classInfo && classInfo.description && primaryDescription !== classInfo.description && (
            <p className="text-xs text-gray-500 mt-1 italic">
              {classInfo.description}
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
