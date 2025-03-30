
import { supabase } from "@/integrations/supabase/client";

/**
 * Process class enrollments from CSV row
 */
export async function processClassEnrollments(
  row: any, 
  tableGroups: Record<string, Record<string, string>>, 
  dogId: string
): Promise<void> {
  if (!tableGroups.class_enrollments) return;
  
  try {
    // Map class enrollment fields from CSV
    const classEnrollments: Record<string, any> = { dog_id: dogId };
    let hasEnrollments = false;
    
    Object.entries(tableGroups.class_enrollments).forEach(([dbField, csvHeader]) => {
      const value = row[csvHeader];
      if (value && value.toString().trim().toLowerCase() !== 'no' && value.toString().trim() !== '0') {
        classEnrollments[dbField] = true;
        hasEnrollments = true;
      } else {
        classEnrollments[dbField] = false;
      }
    });
    
    if (hasEnrollments) {
      // Check if enrollments already exist for this dog
      const { data: existingEnrollments, error: queryError } = await supabase
        .from('class_enrollments')
        .select('id')
        .eq('dog_id', dogId);
        
      if (queryError) throw queryError;
      
      if (existingEnrollments && existingEnrollments.length > 0) {
        // Update existing enrollments
        const enrollmentId = existingEnrollments[0].id;
        const { error } = await supabase
          .from('class_enrollments')
          .update(classEnrollments)
          .eq('id', enrollmentId);
          
        if (error) throw error;
      } else {
        // Create new enrollments
        const { error } = await supabase
          .from('class_enrollments')
          .insert(classEnrollments);
          
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error('Error processing class enrollments:', error);
    throw error;
  }
}
