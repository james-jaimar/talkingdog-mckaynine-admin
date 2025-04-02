
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
      // Prepare notes with more structured information
      let notesArray = [];
      
      if (data.dogDob) {
        notesArray.push(`DOB: ${data.dogDob}`);
      }
      
      // Add puppy-specific information to notes if available
      if (data.puppyVaccinated) {
        notesArray.push(`Vaccinated: Yes${data.puppyVaccinationDate ? `, Date: ${data.puppyVaccinationDate}` : ''}`);
      }
      
      if (data.puppyMicrochipped) {
        notesArray.push(`Microchipped: Yes${data.puppyMicrochipNumber ? `, Number: ${data.puppyMicrochipNumber}` : ''}`);
      }
      
      if (data.puppyDewormingDate) {
        notesArray.push(`Last Deworming: ${data.puppyDewormingDate}`);
      }
      
      if (data.puppyVetName) {
        let vetInfo = `Vet: ${data.puppyVetName}`;
        if (data.puppyVetPhone) vetInfo += `, Phone: ${data.puppyVetPhone}`;
        if (data.puppyVetAddress) vetInfo += `, Address: ${data.puppyVetAddress}`;
        notesArray.push(vetInfo);
      }
      
      // Compile notes
      const notes = notesArray.length > 0 ? notesArray.join('\n') : null;
      
      // Prepare medical notes
      let medicalNotes = data.puppyMedicalConditions || '';
      
      // Prepare behavior notes with puppy-specific information
      let behaviorNotes = data.assessment || '';
      
      if (data.puppyBehaviorIssues) {
        behaviorNotes += (behaviorNotes ? '\n\n' : '') + `Behavior concerns: ${data.puppyBehaviorIssues}`;
      }
      
      if (data.puppyPreviousTraining) {
        behaviorNotes += (behaviorNotes ? '\n\n' : '') + `Previous training: ${data.puppyPreviousTraining}`;
      }
      
      if (data.puppyDiet) {
        behaviorNotes += (behaviorNotes ? '\n\n' : '') + `Diet: ${data.puppyDiet}`;
      }
      
      // Insert dog data
      const dogData = {
        name: data.dogName,
        breed: data.breed,
        client_id: clientId,
        behavior_notes: behaviorNotes || null,
        medical_notes: medicalNotes || null,
        notes: notes,
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
