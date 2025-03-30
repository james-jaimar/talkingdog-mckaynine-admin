
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
  const enrollmentData: {
    dog_id: string;
    puppy_class: boolean;
    eo_class: boolean;
    bronze_cgc_class: boolean;
    silver_cgc_class: boolean;
    beginner_novice_class: boolean;
    wt_class: boolean;
    yoga_class: boolean;
    [key: string]: string | boolean; // Add index signature to allow dynamic property assignment
  } = {
    dog_id: dogId,
    puppy_class: false,
    eo_class: false,
    bronze_cgc_class: false,
    silver_cgc_class: false,
    beginner_novice_class: false,
    wt_class: false,
    yoga_class: false
  };
  
  // Simple function to convert various input formats to boolean
  const toBool = (value: any): boolean => {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const str = value.toLowerCase().trim();
      // Check for various "truthy" string values
      return str === 'yes' || 
             str === 'true' || 
             str === '1' || 
             str === 'y' ||
             str.includes('enrolled') ||
             str.includes('grad') ||
             str.includes('completed') ||
             str.includes('waiting') ||
             str.includes('term') ||
             // Look for percentage indicators
             /\d+(\.\d+)?%/.test(str);
    }
    return false;
  };
  
  // Check the content of CSV columns that might indicate class enrollment
  const directClassMap: Record<string, keyof typeof enrollmentData> = {
    'PUPPY': 'puppy_class',
    'EO': 'eo_class', 
    'BRONZE CGC': 'bronze_cgc_class',
    'SILVER CGC': 'silver_cgc_class',
    'BEGINNER/Novice': 'beginner_novice_class',
    'WT': 'wt_class',
    'YOGA': 'yoga_class'
  };
  
  // First check for direct class columns from field mappings
  Object.entries(fieldMappings).forEach(([csvHeader, dbFieldPath]) => {
    if (dbFieldPath.startsWith('class_enrollments.')) {
      const dbField = dbFieldPath.replace('class_enrollments.', '');
      if (row[csvHeader]) {
        enrollmentData[dbField] = toBool(row[csvHeader]);
      }
    }
  });
  
  // Also look for content in unmapped columns that might indicate class enrollments
  Object.entries(row).forEach(([header, value]) => {
    // Check if this header is one of our direct class names
    if (directClassMap[header] && value) {
      enrollmentData[directClassMap[header]] = toBool(value);
    }
    
    // Also check for class info in the COMMENTS or other text fields
    if (typeof value === 'string') {
      const lowerValue = value.toString().toLowerCase();
      
      if (lowerValue.includes('puppy')) enrollmentData.puppy_class = true;
      if (lowerValue.includes('eo ') || lowerValue.includes('eo jan') || lowerValue.includes('eo april')) enrollmentData.eo_class = true;
      if (lowerValue.includes('bronze')) enrollmentData.bronze_cgc_class = true;
      if (lowerValue.includes('silver')) enrollmentData.silver_cgc_class = true;
      if (lowerValue.includes('beginner') || lowerValue.includes('novice')) enrollmentData.beginner_novice_class = true;
      if (lowerValue.includes('wt ') || lowerValue.includes('waiting')) enrollmentData.wt_class = true;
      if (lowerValue.includes('yoga')) enrollmentData.yoga_class = true;
    }
  });
  
  // Only proceed if we have at least one class enrollment
  const hasClassData = Object.entries(enrollmentData).some(
    ([key, value]) => key !== 'dog_id' && value === true
  );
  
  if (!hasClassData) {
    console.log("No class enrollment data detected for this dog");
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
