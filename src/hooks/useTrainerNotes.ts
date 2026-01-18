import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrainerNote {
  id: string;
  handler_id: string | null;
  task_type: string;
  title: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;
  handler?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TrainerNotesFilters {
  status?: string;
  search?: string;
}

export function useTrainerNotes(filters: TrainerNotesFilters = {}) {
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ["trainer-notes", filters],
    queryFn: async () => {
      let query = supabase
        .from("handler_tasks")
        .select(`
          *,
          handler:clients!handler_tasks_handler_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("task_type", "trainer_note")
        .order("created_at", { ascending: false });

      // Apply status filter
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Transform the data to match our interface
      let notes = (data || []).map(note => ({
        ...note,
        handler: Array.isArray(note.handler) ? note.handler[0] : note.handler,
      })) as TrainerNote[];

      // Apply client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        notes = notes.filter(note => 
          note.title.toLowerCase().includes(searchLower) ||
          note.description?.toLowerCase().includes(searchLower) ||
          note.handler?.first_name?.toLowerCase().includes(searchLower) ||
          note.handler?.last_name?.toLowerCase().includes(searchLower) ||
          note.handler?.email?.toLowerCase().includes(searchLower)
        );
      }

      return notes;
    },
  });

  const acknowledgeNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("handler_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainer-notes"] });
      queryClient.invalidateQueries({ queryKey: ["pending-trainer-note-count"] });
      toast.success("Note acknowledged");
    },
    onError: (error: any) => {
      toast.error(`Failed to acknowledge note: ${error.message}`);
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    refetch: notesQuery.refetch,
    acknowledgeNote,
  };
}

// Hook to get pending trainer note count
export function usePendingTrainerNoteCount() {
  const countQuery = useQuery({
    queryKey: ["pending-trainer-note-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("handler_tasks")
        .select("*", { count: "exact", head: true })
        .eq("task_type", "trainer_note")
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
  });

  return {
    count: countQuery.data || 0,
    isLoading: countQuery.isLoading,
  };
}
