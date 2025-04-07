
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
  // Get booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('dog_id, class_schedule_id')
    .eq('id', bookingId)
    .maybeSingle();
    
  return booking;
}

/**
 * Fetch dog details for a booking
 */
export async function fetchDogDetails(dogId: string): Promise<any> {
  if (!dogId) return null;
  
  const { data: dog } = await supabase
    .from('dogs')
    .select('name, breed')
    .eq('id', dogId)
    .maybeSingle();
    
  return dog;
}

/**
 * Fetch class schedule and class details
 */
export async function fetchClassDetails(classScheduleId: string): Promise<{
  classSchedule: any;
  classData: any;
}> {
  if (!classScheduleId) return { classSchedule: null, classData: null };

  const { data: classSchedule } = await supabase
    .from('class_schedules')
    .select('class_id, start_time')
    .eq('id', classScheduleId)
    .maybeSingle();
    
  if (!classSchedule || !classSchedule.class_id) {
    return { classSchedule, classData: null };
  }
  
  const { data: classData } = await supabase
    .from('classes')
    .select('name, price, description')
    .eq('id', classSchedule.class_id)
    .maybeSingle();
    
  return { classSchedule, classData };
}

/**
 * Enhance an invoice item with booking, dog, and class information
 */
export async function enhanceInvoiceItem(item: InvoiceItem): Promise<InvoiceItem> {
  // Base item
  const enhancedItem: InvoiceItem = { ...item };
  
  // If this item is linked to a booking, fetch related info separately
  if (item.booking_id) {
    try {
      const booking = await fetchBookingDetails(item.booking_id);
      
      if (booking) {
        enhancedItem.bookings = { id: item.booking_id };
        
        // Get dog information
        if (booking.dog_id) {
          const dog = await fetchDogDetails(booking.dog_id);
          
          if (dog) {
            enhancedItem.bookings.dogs = {
              name: dog.name,
              breed: dog.breed
            };
          }
        }
        
        // Get class info
        if (booking.class_schedule_id) {
          const { classSchedule, classData } = await fetchClassDetails(booking.class_schedule_id);
          
          if (classData) {
            enhancedItem.bookings.class_schedules = {
              id: booking.class_schedule_id,
              start_time: classSchedule.start_time || new Date().toISOString(),
              classes: {
                id: classSchedule.class_id,
                name: classData.name,
                price: classData.price,
                description: classData.description || classData.name || 'Training class' // Ensure description has a fallback
              }
            };
            
            // Use class name for description if none provided
            if (!enhancedItem.description || enhancedItem.description === 'Class booking') {
              enhancedItem.description = classData.name || 'Training class';
            }
            
            // Use class price if unit price is missing or zero
            if (!enhancedItem.unit_price || enhancedItem.unit_price === 0) {
              enhancedItem.unit_price = classData.price;
              enhancedItem.amount = classData.price * enhancedItem.quantity;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
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
