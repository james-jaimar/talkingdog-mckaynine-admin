
import { supabase } from "@/integrations/supabase/client";

/**
 * Process dog data from CSV row
 */
export function processDogData(row: any, tableGroups: Record<string, Record<string, string>>, clientId: string): Record<string, any> {
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
 * Create or update a dog in Supabase
 */
export async function createOrUpdateDog(
  dogData: Record<string, any>,
  clientId: string
): Promise<string | undefined> {
  try {
    // Check if dog already exists by name and client_id
    const { data: existingDogs, error: queryError } = await supabase
      .from('dogs')
      .select('id')
      .eq('name', dogData.name)
      .eq('client_id', clientId);
      
    if (queryError) throw queryError;
    
    if (existingDogs && existingDogs.length > 0) {
      // Update existing dog
      const dogId = existingDogs[0].id;
      const { error } = await supabase
        .from('dogs')
        .update(dogData)
        .eq('id', dogId);
        
      if (error) throw error;
      return dogId;
    } else {
      // Create new dog
      const { data, error } = await supabase
        .from('dogs')
        .insert(dogData)
        .select('id')
        .single();
        
      if (error) throw error;
      return data?.id;
    }
  } catch (error) {
    console.error('Error creating/updating dog:', error);
    throw error;
  }
}
