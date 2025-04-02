
import { supabase } from "@/integrations/supabase/client";
import { FormValues } from "../../form/handlerAddFormSchema";

export const useClientNotesUpdate = () => {
  const updateClientNotes = async (data: FormValues, clientId: string): Promise<void> => {
    // Create notes for WhatsApp and photo permission
    let notes = data.comments || "";
    if (data.whatsApp) {
      notes += (notes ? "\n" : "") + "WhatsApp: yes";
    }
    if (data.photoPermission) {
      notes += (notes ? "\n" : "") + "Photo Permission: yes";
    }

    if (notes && notes !== data.comments) {
      // Update client with the notes
      const { error: updateError } = await supabase
        .from("clients")
        .update({ notes })
        .eq("id", clientId);

      if (updateError) {
        console.error("Error updating notes:", updateError);
        // We don't throw as this is just updating additional info
      }
    }
  };

  return { updateClientNotes };
};
