import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HandlerTask {
  id: string;
  handler_id: string;
  class_status_id: string | null;
  class_type: string | null;
  task_type: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  dog_id: string | null;
  dog_name: string | null;
}

export function useHandlerTasks(handlerId?: string) {
  const queryClient = useQueryClient();

  // Fetch tasks for a specific handler or all pending tasks
  const tasksQuery = useQuery({
    queryKey: ["handler-tasks", handlerId],
    queryFn: async (): Promise<HandlerTask[]> => {
      let query = supabase
        .from("handler_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (handlerId) {
        query = query.eq("handler_id", handlerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending task count for dashboard
  const pendingCountQuery = useQuery({
    queryKey: ["handler-tasks-pending-count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("handler_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
  });

  // Mark task as completed
  const completeTask = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("handler_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
          description: notes ? `${notes}` : undefined,
        })
        .eq("id", taskId);

      if (error) throw error;

      // Also mark the handler_class_status action as completed
      const { data: task } = await supabase
        .from("handler_tasks")
        .select("class_status_id, handler_id, dog_id, class_type")
        .eq("id", taskId)
        .single();

      if (task?.class_status_id) {
        await supabase
          .from("handler_class_status")
          .update({
            action_completed: true,
            action_completed_at: new Date().toISOString(),
            action_notes: notes,
          })
          .eq("id", task.class_status_id);
      } else if (task?.handler_id && task?.dog_id && task?.class_type) {
        // Fallback: match by handler + dog + class_type for legacy unlinked tasks
        await supabase
          .from("handler_class_status")
          .update({
            action_completed: true,
            action_completed_at: new Date().toISOString(),
            action_notes: notes,
          })
          .eq("handler_id", task.handler_id)
          .eq("dog_id", task.dog_id)
          .eq("class_type", task.class_type)
          .eq("action_completed", false)
          .neq("next_action", "none");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] });
    },
  });

  // Create a new task
  const createTask = useMutation({
    mutationFn: async (task: Omit<HandlerTask, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from("handler_tasks").insert(task);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] });
    },
  });

  // Cancel a task
  const cancelTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("handler_tasks")
        .update({ status: "cancelled" })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    pendingCount: pendingCountQuery.data || 0,
    completeTask,
    createTask,
    cancelTask,
    refetch: tasksQuery.refetch,
  };
}
