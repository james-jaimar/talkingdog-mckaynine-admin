
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
  handler?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  dog?: {
    id: string;
    name: string;
  };
}

interface TaskFilters {
  status?: string;
  taskType?: string;
  classType?: string;
  search?: string;
}

export function useAllTasks(filters: TaskFilters = {}) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["all-tasks", filters],
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
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.taskType && filters.taskType !== "all") {
        query = query.eq("task_type", filters.taskType);
      }
      if (filters.classType && filters.classType !== "all") {
        query = query.eq("class_type", filters.classType);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Transform the data to match our interface
      let tasks = (data || []).map(task => ({
        ...task,
        handler: Array.isArray(task.handler) ? task.handler[0] : task.handler,
      })) as TaskWithHandler[];

      // Apply client-side search filter
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
      const { error } = await supabase
        .from("handler_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
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
      toast.success("Task cancelled");
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel task: ${error.message}`);
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    completeTask,
    cancelTask,
  };
}

// Hook to get pending task count
export function usePendingTaskCount() {
  const countQuery = useQuery({
    queryKey: ["pending-task-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("handler_tasks")
        .select("*", { count: "exact", head: true })
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
