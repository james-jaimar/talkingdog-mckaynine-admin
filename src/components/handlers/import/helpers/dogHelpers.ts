
import { supabase } from "@/integrations/supabase/client";

// Process dog data from CSV row
export const processDogData = (
  row: any,
  tableGroups: Record<string, Record<string, string>>,
  clientId: string
) => {
  // Initialize with required fields
  const dogData: {
    name: string;
    breed: string;
    client_id: string;
    date_of_birth?: string;
    age?: number;
    notes?: string;
    behavior_notes?: string;
    [key: string]: any;
  } = {
    name: '',
    breed: '',
    client_id: clientId
  };
  
  // Process dog name
  if (tableGroups.dogs.name && row[tableGroups.dogs.name]) {
    dogData.name = row[tableGroups.dogs.name];
  }
  
  // Process dog breed
  if (tableGroups.dogs.breed && row[tableGroups.dogs.breed]) {
    dogData.breed = row[tableGroups.dogs.breed];
  }
  
  // Process dog DOB - store as actual date
  if (tableGroups.dogs.date_of_birth && row[tableGroups.dogs.date_of_birth]) {
    try {
      const dobValue = row[tableGroups.dogs.date_of_birth];
      const dobDate = new Date(dobValue);
      
      if (!isNaN(dobDate.getTime())) {
        // Store the date in ISO format
        dogData.date_of_birth = dobDate.toISOString().split('T')[0];
        
        // Also calculate and store age for convenience
        const today = new Date();
        const ageInYears = Math.floor((today.getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        dogData.age = ageInYears;
      } else {
        // If it's not a valid date, use as-is
        dogData.date_of_birth = dobValue;
      }
    } catch (e) {
      console.warn(`Warning: Could not parse date: ${row[tableGroups.dogs.date_of_birth]}`);
      dogData.date_of_birth = row[tableGroups.dogs.date_of_birth];
    }
  }
  
  // Process dog notes
  if (tableGroups.dogs.notes && row[tableGroups.dogs.notes]) {
    dogData.notes = row[tableGroups.dogs.notes];
  }
  
  // Validate required fields
  if (!dogData.name || !dogData.breed) {
    throw new Error('Missing required dog fields: name or breed');
  }
  
  return dogData;
};

// Handle dog creation or update
export const createOrUpdateDog = async (dogData: any, clientId: string) => {
  // Check if this dog already exists for this client
  const { data: existingDogs } = await supabase
    .from('dogs')
    .select('id, name')
    .eq('client_id', clientId)
    .eq('name', dogData.name);
  
  let dogId: string;
  
  if (existingDogs && existingDogs.length > 0) {
    // Update existing dog
    dogId = existingDogs[0].id;
    const { error: dogError } = await supabase
      .from('dogs')
      .update({
        breed: dogData.breed,
        date_of_birth: dogData.date_of_birth,
        age: dogData.age,
        notes: dogData.notes
      })
      .eq('id', dogId);
      
    if (dogError) throw dogError;
    
    console.log(`Updated existing dog "${dogData.name}" for client ID: ${clientId}`);
  } else {
    // Create new dog
    const { data: newDog, error: dogError } = await supabase
      .from('dogs')
      .insert(dogData)
      .select('id');
      
    if (dogError) throw dogError;
    if (!newDog || newDog.length === 0) {
      throw new Error('Failed to create dog record');
    }
    
    dogId = newDog[0].id;
    console.log(`Created new dog "${dogData.name}" with ID: ${dogId} for client ID: ${clientId}`);
  }
  
  return dogId;
};
