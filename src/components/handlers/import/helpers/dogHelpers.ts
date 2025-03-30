
import { supabase } from "@/integrations/supabase/client";

/**
 * Process dog data from CSV row and create dog in database
 */
export async function processDogData(
  row: any, 
  fieldMappings: Record<string, string>, 
  clientId: string
): Promise<string | undefined> {
  console.log("Processing dog with mappings:", fieldMappings);
  
  // Initialize dog data with required structure
  const dogData: {
    client_id: string;
    name?: string;
    breed?: string;
    age?: number;
    weight?: number;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
    date_of_birth?: string;
  } = { 
    client_id: clientId 
  };
  
  // Map fields from CSV to dog data
  Object.entries(fieldMappings).forEach(([csvHeader, dbFieldPath]) => {
    if (dbFieldPath.startsWith('dogs.')) {
      const field = dbFieldPath.replace('dogs.', '');
      
      // Skip if the value is empty or a dash
      if (row[csvHeader] === '' || row[csvHeader] === '-') return;
      
      // Add to the appropriate field in dogData
      if (field === 'date_of_birth' && row[csvHeader]) {
        // Handle date of birth special case
        dogData.date_of_birth = formatDate(row[csvHeader]);
      } else if (row[csvHeader] !== undefined && row[csvHeader] !== null) {
        (dogData as any)[field] = row[csvHeader];
      }
    }
  });
  
  // Check for Assess/Assessment information and add to notes
  const assessHeader = Object.keys(row).find(header => 
    header.toLowerCase().includes('assess') || 
    header.toLowerCase().includes('notes')
  );
  
  if (assessHeader && row[assessHeader] && row[assessHeader] !== '-') {
    if (dogData.notes) {
      dogData.notes = `${dogData.notes}\nAssessment: ${row[assessHeader]}`;
    } else {
      dogData.notes = `Assessment: ${row[assessHeader]}`;
    }
  }
  
  // Look for breed information if not already mapped
  if (!dogData.breed) {
    const breedHeader = Object.keys(row).find(header => 
      header.toLowerCase().includes('breed') && 
      row[header] && 
      row[header] !== '-'
    );
    
    if (breedHeader) {
      dogData.breed = row[breedHeader];
    }
  }
  
  // Look for DOB information if not already mapped
  if (!dogData.date_of_birth) {
    const dobHeader = Object.keys(row).find(header => 
      (header.toLowerCase().includes('dob') || 
       header.toLowerCase().includes('birth') || 
       header.toLowerCase().includes('date')) && 
      row[header] && 
      row[header] !== '-'
    );
    
    if (dobHeader) {
      dogData.date_of_birth = formatDate(row[dobHeader]);
    }
  }
  
  // Don't create a dog if no dog data was provided
  const hasDogName = !!dogData.name && dogData.name.trim() !== '';
  
  if (!hasDogName) {
    console.log("No dog name provided, skipping dog creation");
    return undefined;
  }
  
  // Ensure required fields are present
  const dogRecord = {
    client_id: dogData.client_id,
    name: dogData.name,
    breed: dogData.breed || 'Unknown Breed',
    // Include other fields if they exist
    age: dogData.age,
    weight: dogData.weight,
    notes: dogData.notes,
    behavior_notes: dogData.behavior_notes,
    medical_notes: dogData.medical_notes,
    avatar_url: dogData.avatar_url,
    date_of_birth: dogData.date_of_birth
  };
  
  console.log("Creating dog with data:", dogRecord);
  
  // Create the dog
  const { data, error } = await supabase
    .from('dogs')
    .insert(dogRecord)
    .select('id')
    .single();
    
  if (error) {
    console.error("Error in dog creation:", error);
    throw error;
  }
  
  const dogId = data?.id;
  console.log("Dog created with ID:", dogId);
  
  return dogId;
}

/**
 * Convert various date formats to ISO format
 */
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  // Try to detect format and convert to ISO
  try {
    // Check if it's already a valid date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Handle common formats
    if (dateString.includes('-')) {
      // Assuming format is DD-MM-YY or DD-MM-YYYY
      const parts = dateString.split('-');
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) {
          year = '20' + year; // Assuming 20xx for 2-digit years
        }
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    if (dateString.includes('/')) {
      // Assuming format is DD/MM/YY or MM/DD/YY
      const parts = dateString.split('/');
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) {
          year = '20' + year; // Assuming 20xx for 2-digit years
        }
        // Assuming MM/DD/YYYY format for simplicity, adjust as needed
        return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
    
    // Handle text month formats like "15-Jun-24" or "15 Jun 24"
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const normalizedDate = dateString.toLowerCase().replace(/[-\s]/g, ' ');
    
    for (let i = 0; i < monthNames.length; i++) {
      if (normalizedDate.includes(monthNames[i])) {
        // Extract day, month, year from the string
        const parts = normalizedDate.split(/\s+/);
        let day = '', month = '', year = '';
        
        for (const part of parts) {
          if (/^\d{1,2}$/.test(part)) {
            day = part.padStart(2, '0');
          } else if (/^\d{2,4}$/.test(part)) {
            year = part.length === 2 ? '20' + part : part;
          } else if (monthNames.includes(part)) {
            month = (monthNames.indexOf(part) + 1).toString().padStart(2, '0');
          }
        }
        
        if (day && month && year) {
          return `${year}-${month}-${day}`;
        }
      }
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }
  
  // Return original if we couldn't format it
  return dateString;
}
