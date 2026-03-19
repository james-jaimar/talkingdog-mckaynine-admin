import { TableCell } from "@/components/ui/table";
import { Mail, MailCheck, ArrowRight, StopCircle, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

    const effectiveType = s.next_action === 'wants_info' && s.action_completed
      ? 'info_sent'
      : s.next_action;

    if (!groups.has(effectiveType)) {
      groups.set(effectiveType, {
        type: effectiveType,
        ...getActionMeta(effectiveType),
        entries: [],
      });
    }

    groups.get(effectiveType)!.entries.push({
      classType: s.class_type,
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

  // If there are pending tasks, show popover on click; otherwise just tooltip
  const hasTasks = pendingTasks.length > 0;

  return (
    <TableCell className="text-center w-[70px]">
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {hasTasks ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity rounded p-0.5 hover:bg-muted">
                <TooltipProvider>
                  {Array.from(groups.values()).map((group) => (
                    <Tooltip key={group.type}>
                      <TooltipTrigger asChild>
                        <span>{group.icon}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{group.label}</p>
                        {group.entries.map((e, i) => (
                          <p key={i} className="text-xs">
                            {e.classType}{e.dogName ? ` (${e.dogName})` : ''}
                          </p>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Related Tasks</h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
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
            </PopoverContent>
          </Popover>
        ) : (
          <TooltipProvider>
            {Array.from(groups.values()).map((group) => (
              <Tooltip key={group.type}>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{group.icon}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{group.label}</p>
                  {group.entries.map((e, i) => (
                    <p key={i} className="text-xs">
                      {e.classType}{e.dogName ? ` (${e.dogName})` : ''}
                    </p>
                  ))}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        )}
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
