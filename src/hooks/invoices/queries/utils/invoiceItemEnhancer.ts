
import { InvoiceItem } from "@/hooks/invoices/types";
import { fetchBookingDetails, fetchClassDetails } from "./bookingFetchers";

/**
 * Enhance an invoice item with booking, dog, and class information
 */
export async function enhanceInvoiceItem(item: InvoiceItem): Promise<InvoiceItem> {
  console.log("Enhancing invoice item:", item);
  
  // Base item
  const enhancedItem: InvoiceItem = { ...item };
  
  // Check if the item description already contains dog name (in format "Class - Dog")
  let embeddedClassName: string | null = null;
  let embeddedDogName: string | null = null;
  
  if (item.description && item.description.includes(' - ')) {
    const parts = item.description.split(' - ');
    if (parts.length >= 2) {
      embeddedClassName = parts[0];
      embeddedDogName = parts[1];
      console.log(`Extracted from description: Class=${embeddedClassName}, Dog=${embeddedDogName}`);
    }
  }
  
  // If this item is linked to a booking, fetch related info
  if (item.booking_id) {
    console.log(`Fetching booking details for booking ID: ${item.booking_id}`);
    try {
      const booking = await fetchBookingDetails(item.booking_id);
      
      if (booking) {
        console.log("Booking details retrieved:", booking);
        
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
          
          console.log(`Dog information retrieved: ${booking.dogs.name} (${booking.dogs.breed})`);
          
          // If the description doesn't already include the dog name, update it
          if (!embeddedDogName) {
            enhancedItem.description = embeddedClassName 
              ? `${embeddedClassName} - ${booking.dogs.name}`
              : `${enhancedItem.description || 'Training services'} - ${booking.dogs.name}`;
              
            console.log(`Updated description to include dog name: ${enhancedItem.description}`);
          }
        } else {
          console.log("No dog information found in booking");
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
            console.log(`Fetching class details for class ID: ${classSchedule.class_id}`);
            
            const classData = await fetchClassDetails(classSchedule.class_id);
            
            if (classData) {
              console.log("Class details retrieved:", classData);
              
              enhancedItem.bookings.class_schedules.classes = {
                id: classData.id,
                name: classData.name,
                price: classData.course_fee || 0, // Using course_fee instead of price
                description: classData.description || classData.name || 'Training class'
              };
              
              // Ensure description includes class name if not already present
              if (!embeddedClassName && 
                  (!enhancedItem.description || 
                   enhancedItem.description === 'Class booking' || 
                   enhancedItem.description === 'Training services')) {
                if (enhancedItem.bookings.dogs?.name) {
                  enhancedItem.description = `${classData.name} - ${enhancedItem.bookings.dogs.name}`;
                } else if (embeddedDogName) {
                  enhancedItem.description = `${classData.name} - ${embeddedDogName}`;
                } else {
                  enhancedItem.description = classData.name;
                }
                console.log(`Updated item description to include class name: ${enhancedItem.description}`);
              }
              
              // Use class price if unit price is missing or zero
              if (!enhancedItem.unit_price || enhancedItem.unit_price === 0) {
                enhancedItem.unit_price = classData.course_fee || 0; // Using course_fee instead of price
                enhancedItem.amount = (classData.course_fee || 0) * enhancedItem.quantity;
                console.log(`Updated item price to class course_fee: ${classData.course_fee}`);
              }
            } else {
              console.log("No class data found for the specified class ID");
            }
          } else {
            console.log("No class ID found in class schedule");
          }
        } else {
          console.log("No class schedule information found in booking");
        }
      } else {
        console.log("No booking data found for the specified booking ID");
      }
    } catch (error) {
      console.error("Error enhancing invoice item with booking details:", error);
      // Continue with basic item data
    }
  } else {
    console.log("No booking ID associated with this invoice item");
  }
  
  // Ensure we have description and prices even if there's no booking
  if (!enhancedItem.description || enhancedItem.description.trim() === '') {
    enhancedItem.description = 'Training services';
    console.log("Set default description: Training services");
  }
  
  if (!enhancedItem.amount && enhancedItem.unit_price && enhancedItem.quantity) {
    enhancedItem.amount = enhancedItem.unit_price * enhancedItem.quantity;
    console.log(`Calculated amount: ${enhancedItem.amount}`);
  }
  
  console.log("Final enhanced invoice item:", enhancedItem);
  return enhancedItem;
}
