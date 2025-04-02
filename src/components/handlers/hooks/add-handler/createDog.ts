
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
    try {
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
        if (dogError.code === "23503") {
          throw new Error("Failed to link dog to client. The client may have been removed.");
        } else if (dogError.code === "23502") {
          throw new Error("Missing required dog information. Please ensure all required fields are filled out.");
        } else {
          throw new Error(`Failed to create dog: ${dogError.message}`);
        }
      }

      console.log("Dog created successfully:", dogResult);

      if (!dogResult?.id) {
        throw new Error("Dog was created but no ID was returned");
      }

      return dogResult;
    } catch (error: any) {
      console.error("Dog creation failed:", error);
      throw error; // Re-throw to be handled by the parent component
    }
  };

  return { createDog };
};
