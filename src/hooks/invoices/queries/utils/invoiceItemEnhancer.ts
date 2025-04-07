
import { InvoiceItem } from "@/hooks/invoices/types";
import { fetchBookingDetails, fetchClassDetails } from "./bookingFetchers";

/**
 * Enhance an invoice item with booking, dog, and class information
 */
export async function enhanceInvoiceItem(item: InvoiceItem): Promise<InvoiceItem> {
  // Base item
  const enhancedItem: InvoiceItem = { ...item };
  
  // If this item is linked to a booking, fetch related info
  if (item.booking_id) {
    try {
      const booking = await fetchBookingDetails(item.booking_id);
      
      if (booking) {
        enhancedItem.bookings = { 
          id: item.booking_id,
          dog_id: booking.dog_id,
          class_schedule_id: booking.class_schedule_id
        };
        
        // Include dog information if available
        if (booking.dogs) {
          enhancedItem.bookings.dogs = {
            name: booking.dogs.name,
            breed: booking.dogs.breed
          };
        }
        
        // Include class schedule and class information if available
        if (booking.class_schedules) {
          const classSchedule = booking.class_schedules;
          enhancedItem.bookings.class_schedules = {
            id: classSchedule.id,
            start_time: classSchedule.start_time || new Date().toISOString()
          };
          
          // Fetch class details
          if (classSchedule.class_id) {
            const classData = await fetchClassDetails(classSchedule.class_id);
            
            if (classData) {
              enhancedItem.bookings.class_schedules.classes = {
                id: classData.id,
                name: classData.name,
                price: classData.price,
                description: classData.description || classData.name || 'Training class'
              };
              
              // Use class name as description if not provided
              if (!enhancedItem.description || enhancedItem.description === 'Class booking' || enhancedItem.description === 'Training services') {
                enhancedItem.description = classData.name;
                console.log(`Updated item description to class name: ${classData.name}`);
              }
              
              // Use class price if unit price is missing or zero
              if (!enhancedItem.unit_price || enhancedItem.unit_price === 0) {
                enhancedItem.unit_price = classData.price;
                enhancedItem.amount = classData.price * enhancedItem.quantity;
                console.log(`Updated item price to class price: ${classData.price}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error enhancing invoice item with booking details:", error);
      // Continue with basic item data
    }
  }
  
  // Ensure we have description and prices even if there's no booking
  if (!enhancedItem.description || enhancedItem.description.trim() === '') {
    enhancedItem.description = 'Training services';
  }
  
  if (!enhancedItem.amount && enhancedItem.unit_price && enhancedItem.quantity) {
    enhancedItem.amount = enhancedItem.unit_price * enhancedItem.quantity;
  }
  
  return enhancedItem;
}
