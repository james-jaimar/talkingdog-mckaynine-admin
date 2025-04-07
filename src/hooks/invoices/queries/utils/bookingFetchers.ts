
import { supabase } from "@/integrations/supabase/client";

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
      client_id,
      class_schedule_id,
      dogs:dog_id (
        id, 
        name, 
        breed
      ),
      clients:client_id (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      class_schedules:class_schedule_id (
        id, 
        start_time,
        class_id,
        classes:class_id (
          id,
          name,
          price,
          description
        )
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
 * Fetch client details by ID
 */
export async function fetchClientDetails(clientId: string): Promise<any> {
  if (!clientId) {
    console.log("No client ID provided to fetch client details");
    return null;
  }
  
  console.log(`Fetching client details for client ID: ${clientId}`);
  
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching client details:", error);
    return null;
  }
  
  console.log("Client details retrieved:", client);
  return client;
}
