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
    // First delete related records to avoid FK constraints
    // Delete dogs belonging to this handler
    const { error: dogsError } = await supabase
      .from('dogs')
      .delete()
      .eq('client_id', id);
    
    if (dogsError) {
      console.error("Error deleting handler's dogs:", dogsError);
      throw dogsError;
    }

    // Delete the handler (client) record
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting handler:", error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in deleteHandler:", error);
    throw error;
  }
};
