import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubstituteRecord {
  id: string;
  class_schedule_id: string;
  class_date: string;
  substitute_trainer_id: string;
  original_trainer_id: string;
  notes: string | null;
  created_at: string;
}

export interface TrainerOption {
  id: string;
  first_name: string;
  last_name: string;
}

export function useSubstituteTrainers(classId: string) {
  const queryClient = useQueryClient();

  // Fetch the schedule for this class to get the trainer_id
  const scheduleQuery = useQuery({
    queryKey: ['class-schedule-for-subs', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('id, trainer_id, selected_dates')
        .eq('class_id', classId)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });

  const scheduleId = scheduleQuery.data?.id;
  const originalTrainerId = scheduleQuery.data?.trainer_id;

  // Fetch existing substitutes for this schedule
  const substitutesQuery = useQuery({
    queryKey: ['class-date-substitutes', scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];
      
      const { data, error } = await supabase
        .from('class_date_substitutes')
        .select('*')
        .eq('class_schedule_id', scheduleId);
      
      if (error) throw error;
      return (data || []) as SubstituteRecord[];
    },
    enabled: !!scheduleId,
  });

  // Fetch all available trainers
  const trainersQuery = useQuery({
    queryKey: ['available-trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return (data || []) as TrainerOption[];
    },
  });

  // Assign a substitute trainer
  const assignSubstitute = useMutation({
    mutationFn: async ({ 
      classDate, 
      substituteTrainerId, 
      notes 
    }: { 
      classDate: string; 
      substituteTrainerId: string; 
      notes?: string;
    }) => {
      if (!scheduleId || !originalTrainerId) {
        throw new Error("Schedule not loaded");
      }

      const { data, error } = await supabase
        .from('class_date_substitutes')
        .upsert({
          class_schedule_id: scheduleId,
          class_date: classDate,
          substitute_trainer_id: substituteTrainerId,
          original_trainer_id: originalTrainerId,
          notes: notes || null,
        }, {
          onConflict: 'class_schedule_id,class_date'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-date-substitutes', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      toast.success("Substitute trainer assigned");
    },
    onError: (error) => {
      console.error("Error assigning substitute:", error);
      toast.error("Failed to assign substitute trainer");
    },
  });

  // Remove a substitute
  const removeSubstitute = useMutation({
    mutationFn: async (classDate: string) => {
      if (!scheduleId) throw new Error("Schedule not loaded");

      const { error } = await supabase
        .from('class_date_substitutes')
        .delete()
        .eq('class_schedule_id', scheduleId)
        .eq('class_date', classDate);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-date-substitutes', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      toast.success("Substitute removed");
    },
    onError: (error) => {
      console.error("Error removing substitute:", error);
      toast.error("Failed to remove substitute");
    },
  });

  // Helper: get substitute for a specific date
  const getSubstituteForDate = (date: string): SubstituteRecord | undefined => {
    const dateOnly = date.split('T')[0];
    return substitutesQuery.data?.find(s => s.class_date === dateOnly);
  };

  // Helper: get trainer name for a given ID
  const getTrainerName = (trainerId: string): string => {
    const trainer = trainersQuery.data?.find(t => t.id === trainerId);
    return trainer ? `${trainer.first_name} ${trainer.last_name}` : 'Unknown';
  };

  return {
    scheduleId,
    originalTrainerId,
    substitutes: substitutesQuery.data || [],
    trainers: trainersQuery.data || [],
    isLoading: scheduleQuery.isLoading || substitutesQuery.isLoading || trainersQuery.isLoading,
    assignSubstitute,
    removeSubstitute,
    getSubstituteForDate,
    getTrainerName,
  };
}
