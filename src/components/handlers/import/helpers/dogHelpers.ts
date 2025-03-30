
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
      
      // Add to the appropriate field in dogData
      if (field === 'date_of_birth' && row[csvHeader]) {
        // Handle date of birth special case
        dogData.date_of_birth = row[csvHeader];
      } else if (row[csvHeader] !== undefined && row[csvHeader] !== null) {
        (dogData as any)[field] = row[csvHeader];
      }
    }
  });
  
  // Don't create a dog if no dog data was provided
  const hasDogData = Object.keys(dogData).length > 1;  // More than just client_id
  
  if (!hasDogData) {
    console.log("No dog data provided, skipping dog creation");
    return undefined;
  }
  
  // Ensure required fields are present
  const dogRecord = {
    client_id: dogData.client_id,
    name: dogData.name || 'Unnamed Dog',
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
