
import { TableCell, TableRow } from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  index: number;
}

export function InvoiceItemRow({ item, index }: InvoiceItemRowProps) {
  console.log(`Rendering invoice item row #${index}:`, item);
  
  // Extract booking information if available
  const booking = item.bookings;
  const hasBookingData = !!booking;
  
  // Get class information
  const classInfo = booking?.class_schedules?.classes;
  const className = classInfo?.name;
  
  // Get dog information
  const dogInfo = booking?.dogs;
  const dogName = dogInfo?.name;
  
  // Determine what to display
  let primaryDescription = item.description || 'Training services';
  let secondaryDescription = null;
  let tertiaryDescription = null;
  
  // If we have booking info, use it to enhance the display
  if (hasBookingData) {
    // If there's both class and dog info, set it as primary description
    if (className && dogName && (!item.description || item.description === 'Training services')) {
      primaryDescription = `${className} - ${dogName}`;
      console.log(`Built primary description from booking data: ${primaryDescription}`);
    } 
    // If description already contains info but we want to show dog details separately
    else if (className && dogName) {
      secondaryDescription = `Dog: ${dogName}`;
      console.log(`Using existing description and adding dog info separately: ${secondaryDescription}`);
    }
    
    // Add class description as tertiary info if available and different from name
    if (classInfo?.description && classInfo.description !== className && classInfo.description.trim() !== '') {
      tertiaryDescription = classInfo.description;
      console.log(`Using class description as tertiary info: ${tertiaryDescription}`);
    }
  }
  // If no booking but the description seems to contain class-dog info (format: "Class - Dog")
  else if (item.description && item.description.includes(' - ')) {
    const parts = item.description.split(' - ');
    if (parts.length >= 2) {
      primaryDescription = parts[0];
      secondaryDescription = `Dog: ${parts[1]}`;
    }
  }
  
  // Add details about the booking connection for debugging
  const hasMissingBooking = !!item.booking_id && !hasBookingData;
  
  return (
    <TableRow>
      <TableCell className="py-4">
        <div>
          <div className="flex items-center">
            <p className="font-medium">{primaryDescription}</p>
            {hasMissingBooking && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-2 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs w-48">This item references booking ID {item.booking_id} but the booking data couldn't be fully loaded</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {secondaryDescription && (
            <p className="text-xs text-gray-500">
              {secondaryDescription}
            </p>
          )}
          
          {tertiaryDescription && (
            <p className="text-xs text-gray-500 mt-1 italic">
              {tertiaryDescription}
            </p>
          )}
          
          {item.booking_id && (
            <p className="text-xs text-gray-400 mt-1">
              Booking #{item.booking_id.substring(0, 8)}
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
