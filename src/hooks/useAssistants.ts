
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Assistant {
  id: string;
  user_id: string | null;
  branch_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  branch?: {
    id: string;
    name: string;
  };
}

export interface CreateAssistantInput {
  branch_id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface UpdateAssistantInput {
  id: string;
  branch_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  notes?: string;
}

export function useAssistants(branchId?: string) {
  return useQuery({
    queryKey: ["assistants", branchId],
    queryFn: async () => {
      let query = supabase
        .from("assistants")
        .select(`
          *,
          branch:branches(id, name)
        `)
        .order("first_name");

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching assistants:", error);
        throw error;
      }

      return data as Assistant[];
    },
  });
}

export function useCreateAssistant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssistantInput) => {
      const { data, error } = await supabase
        .from("assistants")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistants"] });
      toast.success("Assistant added successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating assistant:", error);
      toast.error("Failed to add assistant: " + error.message);
    },
  });
}

export function useUpdateAssistant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAssistantInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("assistants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistants"] });
      toast.success("Assistant updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating assistant:", error);
      toast.error("Failed to update assistant: " + error.message);
    },
  });
}

export function useDeleteAssistant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assistants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistants"] });
      toast.success("Assistant deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting assistant:", error);
      toast.error("Failed to delete assistant: " + error.message);
    },
  });
}
