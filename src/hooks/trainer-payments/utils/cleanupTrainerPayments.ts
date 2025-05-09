
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
    // First check if this is a multi-term class
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('class_schedules')
      .select('multi_term_relation_id')
      .eq('id', scheduleId)
      .single();
      
    if (scheduleError) {
      console.error("Error checking schedule data:", scheduleError);
      return false;
    }
    
    let query = supabase
      .from('trainer_payments')
      .select('id', { count: 'exact' })
      .eq('trainer_id', trainerId);
      
    // If this is part of a multi-term class, we need to check for payments across related schedules
    if (scheduleData.multi_term_relation_id) {
      // Get all related schedule IDs
      const { data: relatedSchedules, error: relatedError } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('multi_term_relation_id', scheduleData.multi_term_relation_id);
        
      if (relatedError) {
        console.error("Error fetching related schedules:", relatedError);
        return false;
      }
      
      if (relatedSchedules && relatedSchedules.length > 0) {
        const relatedIds = relatedSchedules.map(s => s.id);
        query = query.in('class_schedule_id', relatedIds);
      } else {
        query = query.eq('class_schedule_id', scheduleId);
      }
    } else {
      // Regular single-term class
      query = query.eq('class_schedule_id', scheduleId);
    }
    
    // Execute the final query
    const { data, error, count } = await query;
      
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
