
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

// Get commissions grouped by handlers
export function getHandlerCommissions(classDetails: TrainerClassDetail[]) {
  if (!classDetails) return [];

  // Create a map to group commissions by handler
  const handlerMap = new Map();
  
  classDetails.forEach(classDetail => {
    if (!classDetail.bookingsDetails) return;
    
    classDetail.bookingsDetails.forEach(booking => {
      const { handlerName, commissionAmount } = booking;
      
      if (!handlerMap.has(handlerName)) {
        handlerMap.set(handlerName, {
          name: handlerName,
          totalCommission: 0,
          bookings: 0
        });
      }
      
      const handler = handlerMap.get(handlerName);
      handler.totalCommission += commissionAmount;
      handler.bookings += 1;
    });
  });
  
  // Convert map to array and sort by totalCommission descending
  return Array.from(handlerMap.values())
    .sort((a, b) => b.totalCommission - a.totalCommission);
}
