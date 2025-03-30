
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
    // Create the dog
    const { data, error } = await supabase
      .from('dogs')
      .insert(dogData as any)
      .select('id')
      .single();
      
    if (error) throw error;
    
    const dogId = data?.id;
    
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
