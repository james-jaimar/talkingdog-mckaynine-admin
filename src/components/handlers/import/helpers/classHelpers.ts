
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
  interface EnrollmentData {
    dog_id: string;
    puppy_class: boolean;
    eo_class: boolean;
    bronze_cgc_class: boolean;
    silver_cgc_class: boolean;
    beginner_novice_class: boolean;
    wt_class: boolean;
    yoga_class: boolean;
    [key: string]: string | boolean; // Add index signature to allow dynamic property assignment
  }
  
  const enrollmentData: EnrollmentData = {
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
             // Also mark as true if there's any text content that's not 'no' or empty
             (str !== 'no' && str !== 'false' && str !== '0' && str !== 'n' && str !== '' && str !== '-') ||
             // Look for percentage indicators
             /\d+(\.\d+)?%/.test(str);
    }
    return false;
  };
  
  // First check the mapped fields
  Object.entries(fieldMappings).forEach(([csvHeader, dbFieldPath]) => {
    if (dbFieldPath.startsWith('class_enrollments.')) {
      const dbField = dbFieldPath.replace('class_enrollments.', '') as keyof EnrollmentData;
      if (row[csvHeader] !== undefined) {
        enrollmentData[dbField] = toBool(row[csvHeader]);
      }
    }
  });
  
  // Then check for column headers directly from the CSV (in case they weren't explicitly mapped)
  Object.keys(row).forEach(header => {
    // Check for class column headers
    const headerLower = header.toLowerCase().trim();
    
    if (headerLower === 'puppy' || headerLower.includes('puppy')) {
      enrollmentData.puppy_class = toBool(row[header]);
    } else if (headerLower === 'eo' || headerLower.includes('eo ')) {
      enrollmentData.eo_class = toBool(row[header]);
    } else if (headerLower.includes('bronze') || headerLower.includes('bronze cgc')) {
      enrollmentData.bronze_cgc_class = toBool(row[header]);
    } else if (headerLower.includes('silver') || headerLower.includes('silver cgc')) {
      enrollmentData.silver_cgc_class = toBool(row[header]);
    } else if (headerLower.includes('beginner') || headerLower.includes('novice')) {
      enrollmentData.beginner_novice_class = toBool(row[header]);
    } else if (headerLower === 'wt' || headerLower.includes('wt ')) {
      enrollmentData.wt_class = toBool(row[header]);
    } else if (headerLower === 'yoga' || headerLower.includes('yoga')) {
      enrollmentData.yoga_class = toBool(row[header]);
    }
  });
  
  // Also check for class info in the COMMENTS or other text fields
  Object.entries(row).forEach(([header, value]) => {
    if (typeof value === 'string' && value) {
      const lowerValue = value.toString().toLowerCase();
      
      // Special checks for common class indicators in comments
      if (lowerValue.includes('puppy grad') || lowerValue.includes('puppy class')) {
        enrollmentData.puppy_class = true;
      }
      if (lowerValue.includes('eo2') || lowerValue.includes('eo feb') || lowerValue.includes('eo april') || lowerValue.includes('eo jan')) {
        enrollmentData.eo_class = true;
      }
      if (lowerValue.includes('bronze')) {
        enrollmentData.bronze_cgc_class = true;
      }
      if (lowerValue.includes('silver cgc') || (lowerValue.includes('silver') && lowerValue.includes('april'))) {
        enrollmentData.silver_cgc_class = true;
      }
      if (lowerValue.includes('beginner') || lowerValue.includes('novice')) {
        enrollmentData.beginner_novice_class = true;
      }
      if (lowerValue.includes('waiting') || lowerValue.includes('wt ')) {
        enrollmentData.wt_class = true;
      }
      if (lowerValue.includes('yoga')) {
        enrollmentData.yoga_class = true;
      }
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
