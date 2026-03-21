import { TableCell } from "@/components/ui/table";
import { Mail, MailCheck, ArrowRight, StopCircle, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useHandlerTasks } from "@/hooks/useHandlerTasks";
import { toast } from "sonner";



interface ClassStatusItem {
  class_type: string;
  next_action?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
  action_completed?: boolean | null;
  dog_name?: string | null;
  next_class_type?: string | null;
}

interface HandlerStatusCellProps {
  classStatuses?: ClassStatusItem[];
  handlerId: string;
}

interface ActionGroup {
  type: string;
  icon: React.ReactNode;
  label: string;
  entries: { classType: string; dogName: string | null }[];
}

export function HandlerStatusCell({ classStatuses, handlerId }: HandlerStatusCellProps) {
  const { tasks, completeTask, cancelTask } = useHandlerTasks(handlerId);
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  if (!classStatuses || classStatuses.length === 0) {
    return <TableCell className="text-center w-[70px] bg-blue-50/50 border-l border-r border-blue-100" />;
  }

  // Group by effective action type
  const groups = new Map<string, ActionGroup>();

  for (const s of classStatuses) {
    if (!s.next_action || s.next_action === 'none') continue;
    // Skip fully completed/resolved actions — they don't need attention
    if (s.action_completed) continue;

    const effectiveType = s.next_action;

    if (!groups.has(effectiveType)) {
      groups.set(effectiveType, {
        type: effectiveType,
        ...getActionMeta(effectiveType),
        entries: [],
      });
    }

    groups.get(effectiveType)!.entries.push({
      classType: s.next_class_type || s.class_type,
      dogName: s.dog_name || null,
    });
  }

  if (groups.size === 0) {
    return <TableCell className="text-center w-[70px] bg-blue-50/50 border-l border-r border-blue-100" />;
  }

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask.mutateAsync({ taskId });
      toast.success("Task completed");
    } catch {
      toast.error("Failed to complete task");
    }
  };

  const handleCancel = async (taskId: string) => {
    try {
      await cancelTask.mutateAsync(taskId);
      toast.success("Task cancelled");
    } catch {
      toast.error("Failed to cancel task");
    }
  };

  return (
    <TableCell className="text-center w-[70px] bg-blue-50/50 border-l border-r border-blue-100">
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity rounded p-0.5 hover:bg-muted">
              {Array.from(groups.values()).map((group) => (
                <span key={group.type} title={group.label}>{group.icon}</span>
              ))}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              {/* Status summary */}
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Status Summary</h4>
                {Array.from(groups.values()).map((group) => (
                  <div key={group.type} className="flex items-center gap-2 text-sm">
                    {group.icon}
                    <span className="font-medium">{group.label}:</span>
                    <span className="text-muted-foreground">
                      {group.entries.map(e => `${e.classType}${e.dogName ? ` (${e.dogName})` : ''}`).join(', ')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pending tasks */}
              {pendingTasks.length > 0 ? (
                <div className="space-y-2 border-t pt-2">
                  <h4 className="font-medium text-sm">Pending Tasks</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{task.title}</div>
                          {task.dog_name && (
                            <div className="text-xs text-muted-foreground">🐕 {task.dog_name}</div>
                          )}
                          {task.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
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
              ) : (
                <p className="text-xs text-muted-foreground border-t pt-2">No pending tasks</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TableCell>
  );
}

function getActionMeta(type: string): { icon: React.ReactNode; label: string } {
  switch (type) {
    case 'wants_info':
      return { icon: <Mail className="h-4 w-4 text-blue-600" />, label: 'Wants Info' };
    case 'info_sent':
      return { icon: <MailCheck className="h-4 w-4 text-green-600" />, label: 'Info Sent' };
    case 'continuing':
      return { icon: <ArrowRight className="h-4 w-4 text-green-600" />, label: 'Continuing' };
    case 'stopping':
      return { icon: <StopCircle className="h-4 w-4 text-red-600" />, label: 'Stopping' };
    default:
      return { icon: null, label: type };
  }
}
