
import { supabase } from "@/integrations/supabase/client";

export interface ScheduleInfo {
  id: string;
  firstDate: Date;
  termId: string | null;
}

// Get actual schedule IDs for this class to ensure we're using the correct one
// Also returns the first class date for invoice dating
export const fetchScheduleId = async (classId: string): Promise<ScheduleInfo | null> => {
  try {
    // First check if the provided ID is already a schedule ID
    const { data: scheduleCheck, error: scheduleCheckError } = await supabase
      .from('class_schedules')
      .select('id, start_time, selected_dates, term_id')
      .eq('id', classId)
      .maybeSingle();
    
    if (!scheduleCheckError && scheduleCheck) {
      // Determine the first date from selected_dates or start_time
      const firstDate = scheduleCheck.selected_dates && scheduleCheck.selected_dates.length > 0
        ? new Date(scheduleCheck.selected_dates[0])
        : new Date(scheduleCheck.start_time);
      
      return { id: scheduleCheck.id, firstDate, termId: scheduleCheck.term_id };
    }
    
    // If not a schedule ID, look for schedules with this class_id
    const { data: scheduleIds, error } = await supabase
      .from('class_schedules')
      .select('id, start_time, selected_dates, term_id')
      .eq('class_id', classId)
      .order('start_time', { ascending: true })
      .limit(1);
    
    if (error) {
      console.error("Error fetching schedule ID:", error);
      throw error;
    }
    
    if (scheduleIds && scheduleIds.length > 0) {
      const schedule = scheduleIds[0];
      const firstDate = schedule.selected_dates && schedule.selected_dates.length > 0
        ? new Date(schedule.selected_dates[0])
        : new Date(schedule.start_time);
      
      return { id: schedule.id, firstDate, termId: schedule.term_id };
    }
    
    return null;
  } catch (err) {
    console.error("Error fetching schedule ID:", err);
    return null;
  }
};
