import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowRight, StopCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTermOptions } from "@/hooks/useTermOptions";
import { CLASS_TYPES } from "@/components/classes/types/class-types";

interface ClassStatusCellProps {
  classType: string;
  clientId: string;
  initialStatus?: 'completed' | 'passed' | 'no_pass' | 'incomplete' | 'did_not_grade' | 'did_not_attend' | 'interested' | 'not-interested' | null;
  initialPeriod?: string;
  initialPassPercentage?: number | null;
  initialNextAction?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
  initialNotes?: string;
  initialNextClassType?: string | null;
  initialNextTermNumber?: string | null;
  initialNextTermYear?: number | null;
  className?: string;
}

const resultStatusColors: Record<string, string> = {
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'passed': 'bg-green-100 text-green-800 border-green-200',
  'no_pass': 'bg-red-100 text-red-800 border-red-200',
  'incomplete': 'bg-amber-100 text-amber-800 border-amber-200',
  'did_not_grade': 'bg-gray-100 text-gray-600 border-gray-200',
  'did_not_attend': 'bg-gray-50 text-gray-500 border-gray-200',
  'interested': 'bg-amber-100 text-amber-800 border-amber-200',
  'not-interested': 'bg-red-100 text-red-800 border-red-200',
};

const nextActionIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  'wants_info': { icon: <Mail className="h-3 w-3" />, label: 'Wants Info', color: 'text-blue-600' },
  'continuing': { icon: <ArrowRight className="h-3 w-3" />, label: 'Continuing', color: 'text-green-600' },
  'stopping': { icon: <StopCircle className="h-3 w-3" />, label: 'Stopping', color: 'text-red-600' },
};

export function ClassStatusCell({ 
  classType, 
  clientId,
  initialStatus = null,
  initialPeriod = '',
  initialPassPercentage = null,
  initialNextAction = null,
  initialNotes = '',
  initialNextClassType = null,
  initialNextTermNumber = null,
  initialNextTermYear = null,
  className
}: ClassStatusCellProps) {
  const { terms } = useTermOptions();
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [passPercentage, setPassPercentage] = useState<number | null>(initialPassPercentage);
  const [nextAction, setNextAction] = useState<string | null>(initialNextAction);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [nextClassType, setNextClassType] = useState<string | null>(initialNextClassType);
  const [nextTermNumber, setNextTermNumber] = useState<string | null>(initialNextTermNumber);
  const [nextTermYear, setNextTermYear] = useState<number | null>(initialNextTermYear);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  const selectedTermValue = nextTermNumber && nextTermYear 
    ? `${nextTermNumber}-${nextTermYear}` 
    : "";

  const handleTermChange = (value: string) => {
    const [termNum, year] = value.split("-");
    setNextTermNumber(termNum);
    setNextTermYear(parseInt(year));
  };

  // Next class mapping for auto-task creation
  const NEXT_CLASS_MAP: Record<string, string> = {
    "Puppy": "EO",
    "EO": "CGC Bronze",
    "CGC Bronze": "CGC Silver",
    "Beginner": "Novice",
  };

  const handleUpdate = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      // First, get the handler_class_status id if it exists
      const { data: existingStatus } = await supabase
        .from('handler_class_status')
        .select('id')
        .eq('handler_id', clientId)
        .eq('class_type', classType)
        .maybeSingle();

      const { data: upsertedStatus, error } = await supabase
        .from('handler_class_status')
        .upsert({
          handler_id: clientId,
          class_type: classType,
          result_status: status,
          period: period,
          pass_percentage: passPercentage,
          next_action: nextAction || 'none',
          result_notes: notes,
          next_class_type: nextAction === 'continuing' ? nextClassType : null,
          next_term_number: nextAction === 'continuing' ? nextTermNumber : null,
          next_term_year: nextAction === 'continuing' ? nextTermYear : null,
          completed: status === 'passed' || status === 'completed',
          completed_at: (status === 'passed' || status === 'completed') ? new Date().toISOString() : null,
        }, { 
          onConflict: 'handler_id,class_type',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error updating class status:', error);
        toast.error('Failed to update class status');
        return;
      }

      // Create task if next_action changed and requires a task
      // Only create if this is a new action (not updating an existing one with same action)
      const actionChanged = nextAction !== initialNextAction;
      
      if (nextAction === 'wants_info' && actionChanged) {
        const nextClass = NEXT_CLASS_MAP[classType] || "next class";
        await supabase.from("handler_tasks").insert({
          handler_id: clientId,
          class_type: classType,
          class_status_id: upsertedStatus?.id,
          task_type: "send_info_pack",
          title: `Send ${nextClass} info pack`,
          description: `Handler completed ${classType}. Send information about ${nextClass} class.`,
          status: "pending",
        });
      } else if (nextAction === 'continuing' && actionChanged) {
        const nextClass = nextClassType || NEXT_CLASS_MAP[classType] || "next class";
        const termInfo = nextTermNumber && nextTermYear 
          ? `Term ${nextTermNumber} ${nextTermYear}`
          : "upcoming term";
        
        await supabase.from("handler_tasks").insert({
          handler_id: clientId,
          class_type: classType,
          class_status_id: upsertedStatus?.id,
          task_type: "enrollment",
          title: `Enroll in ${nextClass} - ${termInfo}`,
          description: `Handler completed ${classType}. Follow up on enrollment for ${nextClass} in ${termInfo}.`,
          status: "pending",
        });
      }
      
      // Invalidate queries so UI updates without refresh
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-class-status"] });
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      
      toast.success(`${classType} class status updated`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error in handler update:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Render action indicator
  const renderActionIndicator = () => {
    if (!nextAction || nextAction === 'none') return null;
    const actionInfo = nextActionIcons[nextAction];
    if (!actionInfo) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("ml-1", actionInfo.color)}>
              {actionInfo.icon}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{actionInfo.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const showContinuingFields = nextAction === 'continuing';

  // Form content shared between both states
  const renderFormContent = () => (
    <div className="space-y-3">
      <div className="font-medium text-sm">{classType}</div>
      
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Result</label>
        <Select 
          value={status || ''}
          onValueChange={(value) => setStatus(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passed">✓ Passed</SelectItem>
            <SelectItem value="no_pass">✗ No Pass</SelectItem>
            <SelectItem value="incomplete">◐ Incomplete</SelectItem>
            <SelectItem value="did_not_grade">— Did Not Grade</SelectItem>
            <SelectItem value="did_not_attend">○ Did Not Attend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Pass %</label>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="%"
            value={passPercentage ?? ""}
            onChange={(e) => setPassPercentage(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Period</label>
          <Input
            placeholder="e.g., Mar 25"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Next Action</label>
        <Select 
          value={nextAction || 'none'}
          onValueChange={(value) => setNextAction(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None</SelectItem>
            <SelectItem value="continuing">➡️ Continuing</SelectItem>
            <SelectItem value="wants_info">📧 Wants Info</SelectItem>
            <SelectItem value="stopping">⏹️ Stopping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Continuation details - only show when continuing */}
      {showContinuingFields && (
        <div className="grid grid-cols-2 gap-2 p-2 bg-muted/50 rounded-md">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Next Term</label>
            <Select value={selectedTermValue} onValueChange={handleTermChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={`${term.term_number}-${term.year}`} value={`${term.term_number}-${term.year}`}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Next Class</label>
            <Select 
              value={nextClassType || ''}
              onValueChange={(value) => setNextClassType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Notes</label>
        <Textarea
          placeholder="Add notes..."
          className="min-h-[60px] text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button 
        onClick={handleUpdate} 
        disabled={isLoading || (!status && !initialStatus)}
        className="w-full"
        size="sm"
      >
        {isLoading ? "Saving..." : "Save"}
      </Button>
    </div>
  );

  if (!status) {
    return (
      <TableCell className={cn("text-center p-1", className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-6 w-6 p-0 hover:bg-muted"
              disabled={isLoading}
            >
              {isLoading ? "..." : "+"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            {renderFormContent()}
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  }

  // Display compact status with indicators - always show period/date, percentage visible in popover
  const displayText = period || status?.replace('_', ' ') || '';

  return (
    <TableCell className={cn("text-center p-1", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "text-xs px-2 py-1 rounded border inline-flex items-center gap-1",
              resultStatusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200',
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading}
          >
            <span className="truncate max-w-[60px]">{displayText}</span>
            {renderActionIndicator()}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          {renderFormContent()}
        </PopoverContent>
      </Popover>
    </TableCell>
  );
}
