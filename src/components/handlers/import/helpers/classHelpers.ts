
import { supabase } from "@/integrations/supabase/client";
import { classEnrollments } from "../fieldDefinitions";

// Process and store class enrollment data
export const processClassEnrollments = async (
  row: any,
  tableGroups: Record<string, Record<string, string>>,
  dogId: string
) => {
  if (!tableGroups.class_enrollments) return;
  
  for (const enrollment of classEnrollments) {
    const field = enrollment.column;
    if (tableGroups.class_enrollments[field] && row[tableGroups.class_enrollments[field]]) {
      const enrollmentValue = row[tableGroups.class_enrollments[field]];
      if (enrollmentValue && enrollmentValue.trim()) {
        // Here you would store the class enrollment data
        // Since there's no class_enrollments table in the schema yet,
        // we'll store this information in the dog's behavior_notes for now
        const classNote = `${enrollment.description}: ${enrollmentValue.trim()}`;
        
        // Append to existing behavior notes
        const { data: dogData } = await supabase
          .from('dogs')
          .select('behavior_notes')
          .eq('id', dogId)
          .single();
        
        const existingNotes = dogData?.behavior_notes || '';
        const updatedNotes = existingNotes 
          ? `${existingNotes}\n${classNote}` 
          : classNote;
        
        // Update the dog with the new behavior notes
        const { error: updateError } = await supabase
          .from('dogs')
          .update({ behavior_notes: updatedNotes })
          .eq('id', dogId);
        
        if (updateError) {
          console.warn(`Warning: Could not update dog behavior notes: ${updateError.message}`);
        }
      }
    }
  }
};
