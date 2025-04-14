
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
        
        // Get schedule for this class
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('class_id', classId)
          .single();
          
        if (scheduleError) {
          console.error("Error fetching schedule:", scheduleError);
          throw scheduleError;
        }
          
        if (!scheduleData) {
          console.log("No schedule found for class:", classId);
          return [];
        }
        
        // Check if we have selected_dates directly in the schedule
        if (scheduleData.selected_dates && Array.isArray(scheduleData.selected_dates) && scheduleData.selected_dates.length > 0) {
          console.log("Using selected_dates from schedule:", scheduleData.selected_dates.length);
          return scheduleData.selected_dates;
        }
        
        // If no selected_dates, check if we have recurring pattern information
        if (!scheduleData.recurring || !scheduleData.recurrence_pattern) {
          console.log("No recurring pattern found in schedule");
          // If no recurring pattern, use the start_time as the only class date
          return scheduleData.start_time ? [scheduleData.start_time] : [];
        }
        
        // For recurring classes, parse the recurrence pattern
        try {
          const recurrencePattern = JSON.parse(scheduleData.recurrence_pattern);
          
          if (!recurrencePattern || 
              !recurrencePattern.startDate || 
              !recurrencePattern.endDate || 
              !recurrencePattern.daysOfWeek ||
              !Array.isArray(recurrencePattern.daysOfWeek)) {
            console.error("Invalid recurrence pattern format:", recurrencePattern);
            return [scheduleData.start_time]; // Fallback to start_time
          }
          
          // Generate dates based on recurrence pattern
          const dates: string[] = [];
          const startDate = new Date(recurrencePattern.startDate);
          const endDate = new Date(recurrencePattern.endDate);
          const daysOfWeek = recurrencePattern.daysOfWeek;
          
          // Safety check for invalid dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid date range in recurrence pattern:", { startDate: recurrencePattern.startDate, endDate: recurrencePattern.endDate });
            return [scheduleData.start_time]; // Fallback to start_time
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
          return [scheduleData.start_time]; // Fallback to start_time
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
