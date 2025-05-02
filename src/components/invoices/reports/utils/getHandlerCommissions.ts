
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

/**
 * Get commission information for handlers based on class details
 * @param classDetails Array of class details with booking information
 */
export function getHandlerCommissions(classDetails: TrainerClassDetail[]) {
  const handlerCommissions = new Map<string, { name: string; amount: number }>();
  
  for (const classDetail of classDetails) {
    // Skip if there are no bookings details
    if (!classDetail.bookingsDetails || classDetail.bookingsDetails.length === 0) {
      continue;
    }
    
    for (const booking of classDetail.bookingsDetails) {
      if (!booking.clientId) continue;
      
      const handlerId = booking.clientId;
      const handlerName = booking.handlerName || 'Unnamed Handler';
      const commission = booking.commissionAmount || 0;
      
      // Add or update handler commission
      if (handlerCommissions.has(handlerId)) {
        const existing = handlerCommissions.get(handlerId)!;
        handlerCommissions.set(handlerId, {
          name: existing.name,
          amount: existing.amount + commission
        });
      } else {
        handlerCommissions.set(handlerId, {
          name: handlerName,
          amount: commission
        });
      }
    }
  }
  
  // Convert to array and sort by amount
  return Array.from(handlerCommissions.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      amount: data.amount
    }))
    .sort((a, b) => b.amount - a.amount);
}
