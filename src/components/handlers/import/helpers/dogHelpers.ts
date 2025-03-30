
import { supabase } from "@/integrations/supabase/client";

/**
 * Process dog data from CSV row and create dog in database
 */
export async function processDogData(
  row: any, 
  fieldMappings: Record<string, string>, 
  clientId: string
): Promise<string | undefined> {
  const dogData: Record<string, any> = { client_id: clientId };
  
  // Map fields from CSV to dog data
  Object.entries(fieldMappings).forEach(([dbField, csvHeader]) => {
    dogData[dbField] = row[csvHeader];
  });
  
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
    avatar_url: dogData.avatar_url
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
