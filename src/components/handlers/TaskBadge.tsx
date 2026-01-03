import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListTodo, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHandlerTasks, HandlerTask } from "@/hooks/useHandlerTasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskBadgeProps {
  handlerId: string;
}

export function TaskBadge({ handlerId }: TaskBadgeProps) {
  const { tasks, completeTask, cancelTask } = useHandlerTasks(handlerId);
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  
  if (pendingTasks.length === 0) return null;

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask.mutateAsync({ taskId });
      toast.success("Task completed");
    } catch (error) {
      toast.error("Failed to complete task");
    }
  };

  const handleCancel = async (taskId: string) => {
    try {
      await cancelTask.mutateAsync(taskId);
      toast.success("Task cancelled");
    } catch (error) {
      toast.error("Failed to cancel task");
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'send_info_pack':
        return '📧';
      case 'enrollment':
        return '📝';
      case 'follow_up':
        return '📞';
      case 'payment_reminder':
        return '💰';
      default:
        return '📋';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          <ListTodo className="h-3.5 w-3.5" />
          <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-amber-100 text-amber-700">
            {pendingTasks.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Pending Tasks</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pendingTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm"
              >
                <span className="text-base">{getTaskTypeIcon(task.task_type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleComplete(task.id)}
                    disabled={completeTask.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleCancel(task.id)}
                    disabled={cancelTask.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
