import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TaskWithHandler {
  id: string;
  handler_id: string | null;
  task_type: string;
  title: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  class_type: string | null;
  class_status_id: string | null;
  created_at: string | null;
  completed_at: string | null;
  dog_id: string | null;
  dog_name: string | null;
  target_term_id: string | null;
  target_month: string | null;
  handler?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TaskFilters {
  status?: string;
  taskType?: string;
  classType?: string;
  search?: string;
  targetMonth?: string;
}

export function useAllTasks(filters: TaskFilters = {}, branchId?: string) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["all-tasks", filters, branchId],
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
        .neq("task_type", "trainer_note")
        .order("created_at", { ascending: false });

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.taskType && filters.taskType !== "all") {
        query = query.eq("task_type", filters.taskType);
      }
      if (filters.classType && filters.classType !== "all") {
        query = query.eq("class_type", filters.classType);
      }
      if (filters.targetMonth && filters.targetMonth !== "all") {
        if (filters.targetMonth === "unassigned") {
          query = query.is("target_month", null);
        } else {
          query = query.eq("target_month", filters.targetMonth);
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;

      let tasks = (data || []).map(task => ({
        ...task,
        handler: Array.isArray(task.handler) ? task.handler[0] : task.handler,
      })) as TaskWithHandler[];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        tasks = tasks.filter(task => 
          task.title.toLowerCase().includes(searchLower) ||
          task.handler?.first_name?.toLowerCase().includes(searchLower) ||
          task.handler?.last_name?.toLowerCase().includes(searchLower) ||
          task.handler?.email?.toLowerCase().includes(searchLower)
        );
      }

      return tasks;
    },
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      // Get task details before completing for status linkage
      const { data: task } = await supabase
        .from("handler_tasks")
        .select("class_status_id, handler_id, dog_id, class_type")
        .eq("id", taskId)
        .single();

      const { error } = await supabase
        .from("handler_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      // Also mark associated handler_class_status action as completed
      if (task?.class_status_id) {
        await supabase
          .from("handler_class_status")
          .update({ action_completed: true, action_completed_at: new Date().toISOString() })
          .eq("id", task.class_status_id);
      } else if (task?.handler_id && task?.dog_id && task?.class_type) {
        // Fallback match for legacy unlinked tasks
        await supabase
          .from("handler_class_status")
          .update({ action_completed: true, action_completed_at: new Date().toISOString() })
          .eq("handler_id", task.handler_id)
          .eq("dog_id", task.dog_id)
          .eq("class_type", task.class_type)
          .eq("action_completed", false)
          .neq("next_action", "none");
          // Note: stopping actions should never be auto-resolved
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] });
      toast.success("Task marked as completed");
    },
    onError: (error: any) => {
      toast.error(`Failed to complete task: ${error.message}`);
    },
  });

  const cancelTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("handler_tasks")
        .update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] });
      toast.success("Task cancelled");
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel task: ${error.message}`);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Record<string, any> }) => {
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      const { error } = await supabase
        .from("handler_tasks")
        .update(cleanUpdates)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] });
      toast.success("Task updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("handler_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      queryClient.invalidateQueries({ queryKey: ["handlers-pending-tasks"] });
      toast.success("Task deleted");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    completeTask,
    cancelTask,
    updateTask,
    deleteTask,
  };
}

// Hook to get pending task count
export function usePendingTaskCount(branchId?: string) {
  const countQuery = useQuery({
    queryKey: ["pending-task-count", branchId],
    queryFn: async () => {
      let query = supabase
        .from("handler_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .neq("task_type", "trainer_note");

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  return {
    count: countQuery.data || 0,
    isLoading: countQuery.isLoading,
  };
}
