import { TableCell } from "@/components/ui/table";
import { Mail, MailCheck, ArrowRight, StopCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClassStatusItem {
  class_type: string;
  next_action?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
  action_completed?: boolean | null;
  dog_name?: string | null;
}

interface HandlerStatusCellProps {
  classStatuses?: ClassStatusItem[];
}

interface ActionGroup {
  type: string;
  icon: React.ReactNode;
  label: string;
  entries: { classType: string; dogName: string | null }[];
}

export function HandlerStatusCell({ classStatuses }: HandlerStatusCellProps) {
  if (!classStatuses || classStatuses.length === 0) {
    return <TableCell className="text-center w-[70px]" />;
  }

  // Group by effective action type
  const groups = new Map<string, ActionGroup>();

  for (const s of classStatuses) {
    if (!s.next_action || s.next_action === 'none') continue;

    // Determine effective type: wants_info + completed = info_sent
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
    return <TableCell className="text-center w-[70px]" />;
  }

  return (
    <TableCell className="text-center w-[70px]">
      <div className="flex items-center justify-center gap-1 flex-wrap">
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
