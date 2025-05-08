
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to clean up duplicate trainer payments
 * Can be called after critical operations to ensure data integrity
 */
export async function cleanupTrainerPayments(): Promise<boolean> {
  try {
    console.log("Running trainer payment cleanup...");
    const { data, error } = await supabase.rpc('fix_duplicate_trainer_payments');
    
    if (error) {
      console.error("Error running trainer payment cleanup:", error);
      return false;
    }
    
    console.log("Cleanup results:", data);
    return true;
  } catch (err) {
    console.error("Exception during trainer payment cleanup:", err);
    return false;
  }
}

/**
 * Utility to check for potential duplicate trainer payments
 * before operations that might create them
 */
export async function checkForDuplicateTrainerPayments(
  trainerId: string, 
  scheduleId: string
): Promise<boolean> {
  try {
    // Check if we already have a payment record for this combination
    const { data, error, count } = await supabase
      .from('trainer_payments')
      .select('id', { count: 'exact' })
      .eq('trainer_id', trainerId)
      .eq('class_schedule_id', scheduleId);
      
    if (error) {
      console.error("Error checking for duplicate trainer payments:", error);
      return false;
    }
    
    const hasDuplicates = (count || 0) > 1;
    
    if (hasDuplicates) {
      console.warn(`Found ${count} trainer payments for trainer ${trainerId} and schedule ${scheduleId}`);
      // Run cleanup if duplicates found
      await cleanupTrainerPayments();
    }
    
    return !hasDuplicates;
  } catch (err) {
    console.error("Exception checking for duplicate trainer payments:", err);
    return false;
  }
}
