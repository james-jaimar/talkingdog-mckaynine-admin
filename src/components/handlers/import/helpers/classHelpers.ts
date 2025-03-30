
import { supabase } from "@/integrations/supabase/client";

/**
 * Process class enrollment data from CSV row
 */
export async function processClassEnrollments(
  row: any,
  fieldMappings: Record<string, string>,
  dogId: string
): Promise<void> {
  // Define a properly typed enrollment data object
  const enrollmentData = {
    dog_id: dogId,
    puppy_class: false,
    eo_class: false,
    bronze_cgc_class: false,
    silver_cgc_class: false,
    beginner_novice_class: false,
    wt_class: false,
    yoga_class: false
  };
  
  // Map of CSV field paths to database fields
  const classFieldsMap = {
    'class_enrollments.puppy_class': 'puppy_class',
    'class_enrollments.eo_class': 'eo_class',
    'class_enrollments.bronze_cgc_class': 'bronze_cgc_class',
    'class_enrollments.silver_cgc_class': 'silver_cgc_class',
    'class_enrollments.beginner_novice_class': 'beginner_novice_class',
    'class_enrollments.wt_class': 'wt_class',
    'class_enrollments.yoga_class': 'yoga_class'
  };
  
  // Check which class fields are mapped and update enrollment data
  Object.entries(fieldMappings).forEach(([csvHeader, dbFieldPath]) => {
    if (Object.keys(classFieldsMap).includes(dbFieldPath)) {
      const dbField = classFieldsMap[dbFieldPath as keyof typeof classFieldsMap];
      const value = row[csvHeader];
      
      // Convert various formats to boolean
      let boolValue = false;
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          boolValue = value;
        } else if (typeof value === 'number') {
          boolValue = value === 1;
        } else if (typeof value === 'string') {
          const lowercaseValue = value.toLowerCase();
          boolValue = lowercaseValue === 'yes' || 
                    lowercaseValue === 'true' || 
                    lowercaseValue === '1' ||
                    lowercaseValue === 'y';
        }
      }
      
      // Update the enrollment data with the boolean value
      if (dbField === 'puppy_class') enrollmentData.puppy_class = boolValue;
      else if (dbField === 'eo_class') enrollmentData.eo_class = boolValue;
      else if (dbField === 'bronze_cgc_class') enrollmentData.bronze_cgc_class = boolValue;
      else if (dbField === 'silver_cgc_class') enrollmentData.silver_cgc_class = boolValue;
      else if (dbField === 'beginner_novice_class') enrollmentData.beginner_novice_class = boolValue;
      else if (dbField === 'wt_class') enrollmentData.wt_class = boolValue;
      else if (dbField === 'yoga_class') enrollmentData.yoga_class = boolValue;
    }
  });
  
  // Only proceed if we have at least one class enrollment
  const hasClassData = Object.entries(enrollmentData).some(
    ([key, value]) => key !== 'dog_id' && value === true
  );
  
  if (!hasClassData) {
    console.log("No class enrollment data provided, skipping enrollment creation");
    return;
  }
  
  console.log("Creating class enrollment with data:", enrollmentData);
  
  try {
    // Insert enrollment data
    const { error } = await supabase
      .from('class_enrollments')
      .insert(enrollmentData);
      
    if (error) {
      console.error("Error creating class enrollment:", error);
      throw error;
    }
    
    console.log("Class enrollments created successfully");
  } catch (error) {
    console.error("Error in processClassEnrollments:", error);
    // Don't throw the error here, just log it
    // This prevents the entire import from failing if class enrollments fail
  }
}
