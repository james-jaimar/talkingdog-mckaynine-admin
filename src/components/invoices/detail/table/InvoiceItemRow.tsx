
import { TableCell, TableRow } from "@/components/ui/table";
import { InvoiceItem } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useEffect } from "react";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  index: number;
}

export function InvoiceItemRow({ item, index }: InvoiceItemRowProps) {
  // Detailed debug logging to trace invoice item structure
  useEffect(() => {
    console.log(`InvoiceItemRow #${index} data:`, {
      id: item.id,
      description: item.description,
      quantity: item.quantity, 
      unit_price: item.unit_price,
      amount: item.amount,
      calculatedAmount: item.quantity * item.unit_price,
      booking_id: item.booking_id,
      hasBookingData: !!item.bookings
    });
  }, [item, index]);
  
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
    // If there's both class and dog info, ensure it's the primary description
    if (className && dogName) {
      primaryDescription = `${className} - ${dogName}`;
    } 
    
    // Add class description as tertiary info if available and different from name
    if (classInfo?.description && classInfo.description !== className && classInfo.description.trim() !== '') {
      tertiaryDescription = classInfo.description;
    }
  } 
  // If no booking but the description seems to contain class-dog info (format: "Class - Dog")
  else if (item.description && item.description.includes(' - ')) {
    const parts = item.description.split(' - ');
    if (parts.length >= 2) {
      secondaryDescription = `Dog: ${parts[1]}`;
    }
  }
  
  // Calculate the item amount correctly with null/undefined safety
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unit_price || 0);
  const calculatedAmount = quantity * unitPrice;
  
  // Use pre-calculated amount if available, otherwise use our calculation
  const itemAmount = item.amount || calculatedAmount;
  
  // Extract booking ID for display - show just the first 8 characters
  const shortBookingId = item.booking_id ? 
    item.booking_id.substring(0, 8) : null;
  
  // Only show the warning if booking_id exists but booking details are actually missing
  const shouldShowWarning = !!item.booking_id && !hasBookingData;
  
  return (
    <TableRow>
      <TableCell className="py-4">
        <div>
          <div className="flex items-center">
            <p className="font-medium">{primaryDescription}</p>
            {shouldShowWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-2 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs w-48">This item references booking ID {shortBookingId} but its data couldn't be fully loaded</p>
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
          
          {shortBookingId && (
            <p className="text-xs text-gray-400 mt-1">
              Booking #{shortBookingId}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">{quantity}</TableCell>
      <TableCell className="text-right">{formatCurrency(unitPrice)}</TableCell>
      <TableCell className="text-right">
        <div>{formatCurrency(itemAmount)}</div>
        {item.original_amount != null && item.adjustment_reason === 'multi_dog_fair_share' && (
          <div className="text-[10px] text-amber-600 mt-0.5 whitespace-nowrap">
            Adjusted from {formatCurrency(Number(item.original_amount))} · multi-dog fair share
          </div>
        )}
      </TableCell>

  );
}
