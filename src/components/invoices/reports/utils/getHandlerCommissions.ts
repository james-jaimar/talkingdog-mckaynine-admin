
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

interface HandlerCommission {
  name: string;
  totalCommission: number;
  bookingCount: number;
}

/**
 * Calculate handler commissions across all provided class details
 */
export function getHandlerCommissions(classDetails: TrainerClassDetail[]): HandlerCommission[] {
  // Map to track handler totals by name
  const handlersMap = new Map<string, HandlerCommission>();
  
  // Process all class details
  classDetails.forEach(classDetail => {
    if (!classDetail.bookingsDetails || classDetail.bookingsDetails.length === 0) {
      return;
    }
    
    // Process each booking in this class
    classDetail.bookingsDetails.forEach(booking => {
      const handlerName = booking.handlerName || 'Unknown Handler';
      const commission = booking.commissionAmount || 0;
      
      // Get or create handler record
      if (!handlersMap.has(handlerName)) {
        handlersMap.set(handlerName, {
          name: handlerName,
          totalCommission: 0,
          bookingCount: 0
        });
      }
      
      // Update handler record
      const handlerRecord = handlersMap.get(handlerName)!;
      handlerRecord.totalCommission += commission;
      handlerRecord.bookingCount += 1;
    });
  });
  
  // Convert map to array and sort by total commission (highest first)
  return Array.from(handlersMap.values())
    .sort((a, b) => b.totalCommission - a.totalCommission);
}
