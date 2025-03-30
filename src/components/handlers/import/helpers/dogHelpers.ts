
import { supabase } from "@/integrations/supabase/client";
import { processClassEnrollments } from "./classHelpers";

/**
 * Process dog data from CSV row
 */
export function processDogData(
  row: any, 
  tableGroups: Record<string, Record<string, string>>, 
  clientId: string
): Record<string, any> {
  const dogData: Record<string, any> = { client_id: clientId };
  
  // Map fields from CSV to dog data
  if (tableGroups.dogs) {
    Object.entries(tableGroups.dogs).forEach(([dbField, csvHeader]) => {
      dogData[dbField] = row[csvHeader];
    });
  }
  
  return dogData;
}

/**
 * Create a dog in Supabase and process related data
 */
export async function createDog(
  dogData: Record<string, any>,
  row: any,
  tableGroups: Record<string, Record<string, string>>
): Promise<string | undefined> {
  try {
    console.log("Creating dog with data:", dogData);
    
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
    
    if (dogId) {
      // Process class enrollments if they exist
      if (tableGroups.class_enrollments) {
        await processClassEnrollments(row, tableGroups, dogId);
      }
    }
    
    return dogId;
  } catch (error) {
    console.error('Error creating dog:', error);
    throw error;
  }
}
