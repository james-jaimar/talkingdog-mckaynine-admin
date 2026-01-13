import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Check, X } from "lucide-react";
import { useHandlerTasks } from "@/hooks/useHandlerTasks";
import { toast } from "sonner";
import { format } from "date-fns";

interface HandlerTasksProps {
  handlerId: string;
}

export function HandlerTasks({ handlerId }: HandlerTasksProps) {
  const { tasks, isLoading, completeTask, cancelTask } = useHandlerTasks(handlerId);
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');

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
      case 'trainer_note':
        return '💬';
      default:
        return '📋';
    }
  };

  const getTaskTypeBadge = (type: string) => {
    switch (type) {
      case 'send_info_pack':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Info Pack</Badge>;
      case 'enrollment':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Enrollment</Badge>;
      case 'follow_up':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Follow Up</Badge>;
      case 'payment_reminder':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Payment</Badge>;
      case 'trainer_note':
        return <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">Trainer Note</Badge>;
      default:
        return <Badge variant="secondary">Task</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Pending Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  if (pendingTasks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-amber-600" />
          Pending Tasks
          <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700">
            {pendingTasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingTasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
          >
            <span className="text-xl mt-0.5">{getTaskTypeIcon(task.task_type)}</span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{task.title}</span>
                {getTaskTypeBadge(task.task_type)}
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
              {task.due_date && (
                <p className="text-xs text-muted-foreground">
                  Due: {format(new Date(task.due_date), 'PPP')}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200"
                onClick={() => handleComplete(task.id)}
                disabled={completeTask.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                onClick={() => handleCancel(task.id)}
                disabled={cancelTask.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
