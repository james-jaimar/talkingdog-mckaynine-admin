import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowRight, StopCircle, CheckCircle2, Users, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

export type HandlerFilter = 'all' | 'wants_info' | 'continuing' | 'stopping' | 'has_tasks';

interface HandlerFiltersProps {
  currentFilter: HandlerFilter;
  onFilterChange: (filter: HandlerFilter) => void;
  counts: {
    all: number;
    wants_info: number;
    continuing: number;
    stopping: number;
    has_tasks: number;
  };
}

export function HandlerFilters({ currentFilter, onFilterChange, counts }: HandlerFiltersProps) {
  const filters: { key: HandlerFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'All', icon: <Users className="h-3.5 w-3.5" />, color: '' },
    { key: 'wants_info', label: 'Wants Info', icon: <Mail className="h-3.5 w-3.5" />, color: 'text-blue-600' },
    { key: 'continuing', label: 'Continuing', icon: <ArrowRight className="h-3.5 w-3.5" />, color: 'text-green-600' },
    { key: 'stopping', label: 'Stopping', icon: <StopCircle className="h-3.5 w-3.5" />, color: 'text-red-600' },
    { key: 'has_tasks', label: 'Pending Tasks', icon: <ListTodo className="h-3.5 w-3.5" />, color: 'text-amber-600' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={currentFilter === filter.key ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            "gap-1.5",
            currentFilter !== filter.key && filter.color
          )}
        >
          {filter.icon}
          {filter.label}
          {counts[filter.key] > 0 && (
            <Badge 
              variant={currentFilter === filter.key ? "secondary" : "outline"}
              className="ml-1 h-5 min-w-5 px-1.5"
            >
              {counts[filter.key]}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
