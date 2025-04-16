
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useScheduleDates(classId: string) {
  return useQuery({
    queryKey: ['schedule-dates', classId],
    queryFn: async () => {
      try {
        // Validate classId
        if (!classId) {
          console.error("Missing classId in useScheduleDates");
          throw new Error("Missing class ID");
        }
        
        // First check if the ID is a schedule ID
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('id', classId)
          .maybeSingle();
        
        if (!scheduleError && scheduleData) {
          console.log("Found schedule by ID:", scheduleData.id);
          
          // Process the schedule directly
          if (scheduleData.selected_dates && Array.isArray(scheduleData.selected_dates) && scheduleData.selected_dates.length > 0) {
            return scheduleData.selected_dates;
          }
          
          // Return start_time if no selected_dates
          return scheduleData.start_time ? [scheduleData.start_time] : [];
        }
        
        // If not a schedule ID, look for schedules with this class_id
        console.log("Looking up schedules by class_id:", classId);
        const { data: classSchedules, error: classError } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('class_id', classId);
          
        if (classError) {
          console.error("Error fetching schedules by class_id:", classError);
          throw classError;
        }
        
        if (!classSchedules || classSchedules.length === 0) {
          console.log("No schedules found for class:", classId);
          return [];
        }
        
        // Use the first schedule found
        const firstSchedule = classSchedules[0];
        console.log("Using first schedule:", firstSchedule.id);
        
        // Check if we have selected_dates in the first schedule
        if (firstSchedule.selected_dates && Array.isArray(firstSchedule.selected_dates) && firstSchedule.selected_dates.length > 0) {
          console.log("Using selected_dates from schedule:", firstSchedule.selected_dates.length);
          return firstSchedule.selected_dates;
        }
        
        // If no selected_dates, check if we have recurring pattern information
        if (!firstSchedule.recurring || !firstSchedule.recurrence_pattern) {
          console.log("No recurring pattern found in schedule");
          // If no recurring pattern, use the start_time as the only class date
          return firstSchedule.start_time ? [firstSchedule.start_time] : [];
        }
        
        // For recurring classes, parse the recurrence pattern
        try {
          const recurrencePattern = JSON.parse(firstSchedule.recurrence_pattern);
          
          if (!recurrencePattern || 
              !recurrencePattern.startDate || 
              !recurrencePattern.endDate || 
              !recurrencePattern.daysOfWeek ||
              !Array.isArray(recurrencePattern.daysOfWeek)) {
            console.error("Invalid recurrence pattern format:", recurrencePattern);
            return [firstSchedule.start_time]; // Fallback to start_time
          }
          
          // Generate dates based on recurrence pattern
          const dates: string[] = [];
          const startDate = new Date(recurrencePattern.startDate);
          const endDate = new Date(recurrencePattern.endDate);
          const daysOfWeek = recurrencePattern.daysOfWeek;
          
          // Safety check for invalid dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid date range in recurrence pattern:", { startDate: recurrencePattern.startDate, endDate: recurrencePattern.endDate });
            return [firstSchedule.start_time]; // Fallback to start_time
          }
          
          let currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            
            // Check if the current day is in the daysOfWeek array (0 = Sunday, 1 = Monday, etc.)
            if (daysOfWeek.includes(dayOfWeek)) {
              dates.push(currentDate.toISOString());
            }
            
            // Move to next day
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          return dates;
        } catch (e) {
          console.error("Error parsing recurrence pattern:", e);
          return [firstSchedule.start_time]; // Fallback to start_time
        }
      } catch (error) {
        console.error("Error in useScheduleDates:", error);
        throw error;
      }
    },
    // Cache results for 5 minutes since schedule dates don't change often
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
