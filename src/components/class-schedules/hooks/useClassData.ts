
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { Class } from "@/components/classes/types/class";
import { ClassSchedule } from "@/components/classes/types/class-schedule";

interface UseClassDataProps {
  classId?: string;
  scheduleId?: string;
}

export function useClassData({ classId, scheduleId }: UseClassDataProps) {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  
  // Fetch class data
  const {
    data: classData,
    isLoading: isClassLoading,
    error: classError,
  } = useQuery({
    queryKey: ['class-detail', classId],
    queryFn: async () => {
      if (!classId) return null;
      
      console.log(`Fetching class details for ID: ${classId}`);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          branches:branch_id (name)
        `)
        .eq('id', classId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching class details:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No class found with ID:", classId);
        return null;
      }
      
      console.log("Found class data:", data);
      return data as Class;
    },
    enabled: !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch schedule data if scheduleId is provided
  const {
    data: scheduleData,
    isLoading: isScheduleLoading,
    error: scheduleError,
  } = useQuery({
    queryKey: ['schedule-detail', scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;
      
      console.log(`Fetching schedule details for ID: ${scheduleId}`);
      
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          trainer:trainer_id (first_name, last_name)
        `)
        .eq('id', scheduleId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching schedule details:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No schedule found with ID:", scheduleId);
        return null;
      }
      
      console.log("Found schedule data:", data);
      return data as ClassSchedule;
    },
    enabled: !!scheduleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLoading = isClassLoading || isScheduleLoading;
  const error = classError || scheduleError;

  return {
    classData,
    scheduleData,
    isLoading,
    error,
    isAuthenticated: !!user && !!session,
    hasBranch: !!currentBranch
  };
}
