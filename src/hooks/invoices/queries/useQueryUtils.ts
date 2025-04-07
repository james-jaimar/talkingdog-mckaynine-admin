
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
import { toast } from "sonner";

/**
 * Fetch the base invoice data with client information
 */
export async function fetchInvoiceWithClient(invoiceId: string): Promise<Invoice> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      clients:client_id (id, first_name, last_name, email, phone, address, city, postal_code)
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError) {
    console.error("Error fetching invoice:", invoiceError);
    toast.error("Could not retrieve invoice details");
    throw invoiceError;
  }

  if (!invoice) {
    toast.error("Invoice not found");
    throw new Error("Invoice not found");
  }

  console.log("Fetched invoice data:", invoice);
  return invoice as Invoice;
}

/**
 * Fetch invoice items for a specific invoice
 */
export async function fetchInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (itemsError) {
    console.error("Error fetching invoice items:", itemsError);
    toast.error("Could not retrieve invoice items");
    return [];
  }

  console.log("Fetched invoice items:", items);
  return items as InvoiceItem[];
}

/**
 * Create a default invoice item when no items exist
 */
export function createDefaultInvoiceItem(total: number): InvoiceItem {
  console.log("Creating a default item based on invoice total");
  return {
    description: "Training services",
    quantity: 1,
    unit_price: total,
    amount: total
  };
}

/**
 * Fetch booking details for an invoice item
 */
export async function fetchBookingDetails(bookingId: string): Promise<any> {
  if (!bookingId) {
    console.log("No booking ID provided to fetch booking details");
    return null;
  }
  
  console.log(`Fetching booking details for booking ID: ${bookingId}`);
  
  // Get booking with expanded relationships for dog and class schedule
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      dog_id,
      class_schedule_id,
      dogs:dog_id (
        id, 
        name, 
        breed
      ),
      class_schedules:class_schedule_id (
        id, 
        start_time,
        class_id
      )
    `)
    .eq('id', bookingId)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching booking details:", error);
    return null;
  }
  
  console.log("Booking details retrieved:", booking);
  return booking;
}

/**
 * Fetch class details for a class schedule
 */
export async function fetchClassDetails(classId: string): Promise<any> {
  if (!classId) {
    console.log("No class ID provided to fetch class details");
    return null;
  }
  
  console.log(`Fetching class details for class ID: ${classId}`);
  
  const { data: classData, error } = await supabase
    .from('classes')
    .select('id, name, price, description')
    .eq('id', classId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching class details:", error);
    return null;
  }
  
  console.log("Class details retrieved:", classData);
  return classData;
}

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

/**
 * Handle errors in query functions
 */
export const handleQueryError = (error: any, message: string): never => {
  console.error(message, error);
  toast.error(message);
  throw error;
};
