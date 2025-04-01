
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScheduleDate } from "../types/attendance";

export function useScheduleDates(classId: string) {
  return useQuery({
    queryKey: ['class-schedule-dates', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('id, start_time, selected_dates')
        .eq('class_id', classId);
      
      if (error) throw error;
      
      // Extract unique dates from all schedules
      const dates = new Set<string>();
      data.forEach(schedule => {
        dates.add(format(new Date(schedule.start_time), 'yyyy-MM-dd'));
        
        if (schedule.selected_dates) {
          schedule.selected_dates.forEach((date: string) => {
            dates.add(format(new Date(date), 'yyyy-MM-dd'));
          });
        }
      });
      
      return Array.from(dates).sort();
    }
  });
}
