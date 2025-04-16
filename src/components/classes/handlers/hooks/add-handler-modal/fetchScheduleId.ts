
import { supabase } from "@/integrations/supabase/client";

// Get actual schedule IDs for this class to ensure we're using the correct one
export const fetchScheduleId = async (classId: string): Promise<string | null> => {
  try {
    // First check if the provided ID is already a schedule ID
    const { data: scheduleCheck, error: scheduleCheckError } = await supabase
      .from('class_schedules')
      .select('id')
      .eq('id', classId)
      .maybeSingle();
    
    if (!scheduleCheckError && scheduleCheck) {
      return scheduleCheck.id;
    }
    
    // If not a schedule ID, look for schedules with this class_id
    const { data: scheduleIds, error } = await supabase
      .from('class_schedules')
      .select('id')
      .eq('class_id', classId)
      .order('start_time', { ascending: true })
      .limit(1);
    
    if (error) {
      console.error("Error fetching schedule ID:", error);
      throw error;
    }
    
    return scheduleIds && scheduleIds.length > 0 ? scheduleIds[0].id : null;
  } catch (err) {
    console.error("Error fetching schedule ID:", err);
    return null;
  }
};
