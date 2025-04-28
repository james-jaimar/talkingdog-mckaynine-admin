
import { InvoiceItem, BookingWithDetails } from "../../types";

/**
 * Extracts and formats relevant information from a booking for display
 * @param booking The booking object with related data
 * @returns Formatted booking details
 */
export function extractBookingDetails(booking: any) {
  if (!booking) return null;
  
  try {
    // Extract dog information if available
    const dog = booking.dogs ? {
      name: booking.dogs.name,
      breed: booking.dogs.breed
    } : null;
    
    // Extract class information if available
    const classSchedule = booking.class_schedules ? {
      id: booking.class_schedules.id,
      start_time: booking.class_schedules.start_time,
      class_id: booking.class_schedules.class_id,
      classes: booking.class_schedules.classes
    } : null;
    
    // Debug the extracted data
    console.log("Extracted booking details:", {
      id: booking.id,
      dog,
      classSchedule: classSchedule ? {
        id: classSchedule.id,
        class_name: classSchedule.classes?.name,
      } : null
    });
    
    return {
      id: booking.id,
      dog,
      classSchedule
    };
  } catch (error) {
    console.error("Error extracting booking details:", error);
    return null;
  }
}

/**
 * Enhances an invoice item with booking details in a more readable format
 * @param item The invoice item to enhance
 * @returns Enhanced invoice item with formatted booking details
 */
export function enhanceInvoiceItem(item: InvoiceItem): InvoiceItem {
  if (!item.bookings) {
    return item;
  }
  
  try {
    // Convert booking to the proper type
    const booking = item.bookings as unknown as BookingWithDetails;
    
    // Extract class schedule info
    const classSchedule = booking.class_schedules ? {
      id: booking.class_schedules.id,
      start_time: booking.class_schedules.start_time,
      class_id: booking.class_schedules.class_id,
      classes: booking.class_schedules.classes
    } : null;
    
    // Return the enhanced item
    return {
      ...item,
      bookings: booking,
      booking_details: {
        id: booking.id,
        dog: {
          name: booking.dogs.name,
          breed: booking.dogs.breed
        },
        class_schedule: classSchedule as any
      }
    };
  } catch (error) {
    console.error("Error enhancing invoice item:", error, "Item:", item);
    return item;
  }
}
