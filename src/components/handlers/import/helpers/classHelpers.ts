
import { supabase } from "@/integrations/supabase/client";

/**
 * Process class enrollment data from CSV row
 */
export async function processClassEnrollments(
  row: any,
  fieldMappings: Record<string, string>,
  dogId: string
): Promise<void> {
  console.log("Processing class enrollments with mappings:", fieldMappings);
  
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
  
  // Check which class fields are mapped
  const classFields = [
    { csvField: 'class_enrollments.puppy_class', dbField: 'puppy_class' },
    { csvField: 'class_enrollments.eo_class', dbField: 'eo_class' },
    { csvField: 'class_enrollments.bronze_cgc_class', dbField: 'bronze_cgc_class' },
    { csvField: 'class_enrollments.silver_cgc_class', dbField: 'silver_cgc_class' },
    { csvField: 'class_enrollments.beginner_novice_class', dbField: 'beginner_novice_class' },
    { csvField: 'class_enrollments.wt_class', dbField: 'wt_class' },
    { csvField: 'class_enrollments.yoga_class', dbField: 'yoga_class' }
  ];
  
  // Check which classes are enabled
  classFields.forEach(({ csvField, dbField }) => {
    const csvHeader = Object.entries(fieldMappings).find(([_, value]) => value === csvField)?.[0];
    
    if (csvHeader) {
      const value = row[csvHeader];
      // Convert various formats to boolean
      const boolValue = value && 
        (value === true || 
         value === 1 || 
         value === '1' || 
         value.toString().toLowerCase() === 'yes' || 
         value.toString().toLowerCase() === 'true');
         
      // Safely assign the boolean value using a type-safe approach
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
  
  // Insert enrollment data
  const { error } = await supabase
    .from('class_enrollments')
    .insert(enrollmentData);
    
  if (error) {
    console.error("Error creating class enrollment:", error);
    throw error;
  }
  
  console.log("Class enrollments created successfully");
}
