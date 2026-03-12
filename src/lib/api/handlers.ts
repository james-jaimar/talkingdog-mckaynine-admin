import { supabase } from "@/integrations/supabase/client";

/**
 * API functions for handlers management
 */

/**
 * Delete a handler by ID
 * @param id Handler ID to delete
 * @returns Promise with the deletion result
 */
export const deleteHandler = async (id: string) => {
  try {
    // 1. Delete handler_class_status (references handler_id & dog_id)
    const { error: hcsError } = await supabase
      .from('handler_class_status')
      .delete()
      .eq('handler_id', id);
    if (hcsError) { console.error("Error deleting handler_class_status:", hcsError); throw hcsError; }

    // 2. Delete handler_tasks (references handler_id)
    const { error: tasksError } = await supabase
      .from('handler_tasks')
      .delete()
      .eq('handler_id', id);
    if (tasksError) { console.error("Error deleting handler_tasks:", tasksError); throw tasksError; }

    // 3. Get all bookings for this handler to clean up attendance & invoice items
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('client_id', id);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id);

      // 4. Delete class_attendance records
      const { error: attendanceError } = await supabase
        .from('class_attendance')
        .delete()
        .in('booking_id', bookingIds);
      if (attendanceError) { console.error("Error deleting attendance:", attendanceError); throw attendanceError; }

      // 5. Nullify invoice_items booking references
      const { error: invoiceError } = await supabase
        .from('invoice_items')
        .update({ booking_id: null })
        .in('booking_id', bookingIds);
      if (invoiceError) { console.error("Error updating invoice_items:", invoiceError); throw invoiceError; }

      // 6. Nullify trainer_payments booking references
      await supabase
        .from('trainer_payments')
        .update({ booking_id: null })
        .in('booking_id', bookingIds);

      // 7. Delete bookings
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('client_id', id);
      if (bookingsError) { console.error("Error deleting bookings:", bookingsError); throw bookingsError; }
    }

    // 8. Delete dogs
    const { error: dogsError } = await supabase
      .from('dogs')
      .delete()
      .eq('client_id', id);
    if (dogsError) { console.error("Error deleting dogs:", dogsError); throw dogsError; }

    // 9. Delete client_branches
    const { error: cbError } = await supabase
      .from('client_branches')
      .delete()
      .eq('client_id', id);
    if (cbError) { console.error("Error deleting client_branches:", cbError); throw cbError; }

    // 10. Delete the handler (client) record
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (error) { console.error("Error deleting handler:", error); throw error; }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteHandler:", error);
    throw error;
  }
};
