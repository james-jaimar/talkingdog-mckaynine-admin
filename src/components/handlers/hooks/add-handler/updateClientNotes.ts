
import { supabase } from "@/integrations/supabase/client";
import { FormValues } from "../../form/handlerAddFormSchema";

export const useClientNotesUpdate = () => {
  const updateClientNotes = async (data: FormValues, clientId: string): Promise<void> => {
    try {
      // Create notes for WhatsApp, photo permission, and indemnity agreement
      let notes = data.comments || "";
      
      if (data.whatsApp) {
        notes += (notes ? "\n" : "") + "WhatsApp: yes";
      }
      
      if (data.photoPermission) {
        notes += (notes ? "\n" : "") + "Photo Permission: yes";
      }
      
      if (data.indemnityAgreement) {
        notes += (notes ? "\n" : "") + "Signed Indemnity Agreement: yes";
      }

      if (notes && notes !== data.comments) {
        // Update client with the notes
        const { error: updateError } = await supabase
          .from("clients")
          .update({ notes })
          .eq("id", clientId);

        if (updateError) {
          console.error("Error updating notes:", updateError);
          // We log this but don't throw as it's supplementary information
          if (updateError.code === "23503") {
            console.warn("Client no longer exists, cannot update preferences notes");
          } else {
            console.warn(`Notes update failed: ${updateError.message}`);
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to update client notes:", error);
      // We don't throw here as this is just supplementary information
    }
  };

  return { updateClientNotes };
};
