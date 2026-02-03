
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrainingSessionSlot {
  id: string;
  training_session_id: string;
  time_slot: string;
  display_name: string;
  sort_order: number;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  branch_id: string;
  session_date: string;
  term_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  slots?: TrainingSessionSlot[];
  branch?: {
    id: string;
    name: string;
  };
}

export interface BranchTimeSlot {
  id: string;
  branch_id: string;
  time_slot: string;
  display_name: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface CreateSessionInput {
  branch_id: string;
  session_dates: string[];
  notes?: string;
}

export function useTrainingSessions(branchId?: string) {
  return useQuery({
    queryKey: ["training-sessions", branchId],
    queryFn: async () => {
      let query = supabase
        .from("training_sessions")
        .select(`
          *,
          slots:training_session_slots(*),
          branch:branches(id, name)
        `)
        .order("session_date", { ascending: true });

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching training sessions:", error);
        throw error;
      }

      return data as TrainingSession[];
    },
  });
}

export function useBranchTimeSlots(branchId?: string) {
  return useQuery({
    queryKey: ["branch-time-slots", branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from("branch_time_slots")
        .select("*")
        .eq("branch_id", branchId)
        .order("sort_order");

      if (error) {
        console.error("Error fetching branch time slots:", error);
        throw error;
      }

      return data as BranchTimeSlot[];
    },
    enabled: !!branchId,
  });
}

export function useCreateTrainingSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const { branch_id, session_dates, notes } = input;

      // Get default time slots for the branch
      const { data: defaultSlots } = await supabase
        .from("branch_time_slots")
        .select("*")
        .eq("branch_id", branch_id)
        .eq("is_default", true)
        .order("sort_order");

      const createdSessions = [];

      for (const date of session_dates) {
        // Create the session
        const { data: session, error: sessionError } = await supabase
          .from("training_sessions")
          .insert({
            branch_id,
            session_date: date,
            notes,
          })
          .select()
          .single();

        if (sessionError) {
          // Skip if session already exists
          if (sessionError.code === "23505") continue;
          throw sessionError;
        }

        // Create slots for the session using branch defaults
        if (defaultSlots && defaultSlots.length > 0) {
          const slotsToCreate = defaultSlots.map((slot) => ({
            training_session_id: session.id,
            time_slot: slot.time_slot,
            display_name: slot.display_name,
            sort_order: slot.sort_order,
          }));

          await supabase.from("training_session_slots").insert(slotsToCreate);
        }

        createdSessions.push(session);
      }

      return createdSessions;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success(`${data.length} training session(s) created successfully`);
    },
    onError: (error: Error) => {
      console.error("Error creating training sessions:", error);
      toast.error("Failed to create training sessions: " + error.message);
    },
  });
}

export function useDeleteTrainingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success("Training session deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting training session:", error);
      toast.error("Failed to delete training session: " + error.message);
    },
  });
}

export function useCreateBranchTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      branch_id: string;
      time_slot: string;
      display_name: string;
      sort_order?: number;
      is_default?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("branch_time_slots")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-time-slots"] });
      toast.success("Time slot added successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating time slot:", error);
      toast.error("Failed to add time slot: " + error.message);
    },
  });
}

export function useDeleteBranchTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("branch_time_slots")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-time-slots"] });
      toast.success("Time slot deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting time slot:", error);
      toast.error("Failed to delete time slot: " + error.message);
    },
  });
}
