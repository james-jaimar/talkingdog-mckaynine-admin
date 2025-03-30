
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
  
  // Build enrollment data with explicit dog_id field
  const enrollmentData: {
    dog_id: string;
    puppy_class?: boolean;
    eo_class?: boolean;
    bronze_cgc_class?: boolean;
    silver_cgc_class?: boolean;
    beginner_novice_class?: boolean;
    wt_class?: boolean;
    yoga_class?: boolean;
  } = {
    dog_id: dogId
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
         
      // Assign the boolean value to the proper field
      (enrollmentData as any)[dbField] = !!boolValue;
    }
  });
  
  // Only proceed if we have at least one class enrollment
  let hasClassData = false;
  for (const key in enrollmentData) {
    if (key !== 'dog_id' && enrollmentData[key as keyof typeof enrollmentData] === true) {
      hasClassData = true;
      break;
    }
  }
  
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
