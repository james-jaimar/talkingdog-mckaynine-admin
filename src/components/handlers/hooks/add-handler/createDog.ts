
import { supabase } from "@/integrations/supabase/client";
import { FormValues } from "../../form/handlerAddFormSchema";

export interface DogData {
  id: string;
  [key: string]: any;
}

export const useDogCreation = () => {
  const createDog = async (
    data: FormValues,
    clientId: string
  ): Promise<DogData> => {
    // Insert dog data
    const dogData = {
      name: data.dogName,
      breed: data.breed,
      client_id: clientId,
      behavior_notes: data.assessment || null,
      notes: data.dogDob ? `DOB: ${data.dogDob}` : null,
    };
    
    console.log("Inserting dog data:", dogData);
    
    const { data: dogResult, error: dogError } = await supabase
      .from("dogs")
      .insert(dogData)
      .select("id")
      .single();

    if (dogError) {
      console.error("Dog insertion error:", dogError);
      throw new Error(`Failed to create dog: ${dogError.message}`);
    }

    console.log("Dog created successfully:", dogResult);

    if (!dogResult?.id) {
      throw new Error("Dog was created but no ID was returned");
    }

    return dogResult;
  };

  return { createDog };
};
