
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

/**
 * Extracts handler commission data from class details
 * Returns either actual handler details or generates placeholder data
 */
export function getHandlerCommissionsForClass(classDetail: TrainerClassDetail) {
  // If we have bookingsDetails with handler information, use it
  if (classDetail.bookingsDetails && classDetail.bookingsDetails.length > 0) {
    return classDetail.bookingsDetails;
  }
  
  // Fallback: simulate with count of bookings (should not happen with our fixes)
  const result = [];
  for (let i = 1; i <= classDetail.bookings; i++) {
    result.push({
      bookingId: `placeholder-${i}`,
      clientId: `placeholder-${i}`,
      handlerName: `Client ${i}`,
      commissionAmount: Math.round((classDetail.potentialRevenue || 0) / classDetail.bookings)
    });
  }
  return result;
}
