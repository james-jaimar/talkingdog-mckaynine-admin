
import { supabase } from "@/integrations/supabase/client";

/**
 * Process class enrollments from CSV row
 */
export async function processClassEnrollments(
  row: any, 
  fieldMappings: Record<string, string>, 
  dogId: string
): Promise<void> {
  try {
    // Map class enrollment fields from CSV
    const classEnrollments = {
      dog_id: dogId,
      puppy_class: false,
      eo_class: false,
      bronze_cgc_class: false,
      silver_cgc_class: false,
      beginner_novice_class: false,
      wt_class: false,
      yoga_class: false
    };
    
    let hasEnrollments = false;
    
    Object.entries(fieldMappings).forEach(([dbField, csvHeader]) => {
      const value = row[csvHeader];
      if (value && value.toString().trim().toLowerCase() !== 'no' && value.toString().trim() !== '0') {
        classEnrollments[dbField as keyof typeof classEnrollments] = true;
        hasEnrollments = true;
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
