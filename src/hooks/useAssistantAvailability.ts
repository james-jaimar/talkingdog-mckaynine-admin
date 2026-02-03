
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AssistantAvailability {
  id: string;
  assistant_id: string;
  training_session_slot_id: string;
  status: "available" | "unavailable" | "not_marked";
  notes: string | null;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityWithDetails extends AssistantAvailability {
  assistant?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
  };
  slot?: {
    id: string;
    time_slot: string;
    display_name: string;
    training_session_id: string;
  };
}

export function useAssistantAvailability(branchId?: string) {
  return useQuery({
    queryKey: ["assistant-availability", branchId],
    queryFn: async () => {
      // First get all sessions for the branch
      let sessionsQuery = supabase
        .from("training_sessions")
        .select("id")
        .order("session_date");

      if (branchId) {
        sessionsQuery = sessionsQuery.eq("branch_id", branchId);
      }

      const { data: sessions } = await sessionsQuery;
      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map((s) => s.id);

      // Get all slots for these sessions
      const { data: slots } = await supabase
        .from("training_session_slots")
        .select("id")
        .in("training_session_id", sessionIds);

      if (!slots || slots.length === 0) return [];

      const slotIds = slots.map((s) => s.id);

      // Get availability for these slots
      const { data, error } = await supabase
        .from("assistant_availability")
        .select(`
          *,
          assistant:assistants(id, first_name, last_name, email),
          slot:training_session_slots(id, time_slot, display_name, training_session_id)
        `)
        .in("training_session_slot_id", slotIds);

      if (error) {
        console.error("Error fetching availability:", error);
        throw error;
      }

      return data as AvailabilityWithDetails[];
    },
    enabled: !!branchId,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      assistant_id: string;
      training_session_slot_id: string;
      status: "available" | "unavailable" | "not_marked";
      notes?: string;
      marked_by?: string;
    }) => {
      // Upsert the availability
      const { data, error } = await supabase
        .from("assistant_availability")
        .upsert(
          {
            assistant_id: input.assistant_id,
            training_session_slot_id: input.training_session_slot_id,
            status: input.status,
            notes: input.notes || null,
            marked_by: input.marked_by || null,
          },
          {
            onConflict: "assistant_id,training_session_slot_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant-availability"] });
    },
    onError: (error: Error) => {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability: " + error.message);
    },
  });
}

export function useBulkUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Array<{
        assistant_id: string;
        training_session_slot_id: string;
        status: "available" | "unavailable" | "not_marked";
        notes?: string;
        marked_by?: string;
      }>
    ) => {
      const { data, error } = await supabase
        .from("assistant_availability")
        .upsert(
          updates.map((u) => ({
            assistant_id: u.assistant_id,
            training_session_slot_id: u.training_session_slot_id,
            status: u.status,
            notes: u.notes || null,
            marked_by: u.marked_by || null,
          })),
          {
            onConflict: "assistant_id,training_session_slot_id",
          }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant-availability"] });
      toast.success("Availability updated");
    },
    onError: (error: Error) => {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability: " + error.message);
    },
  });
}
