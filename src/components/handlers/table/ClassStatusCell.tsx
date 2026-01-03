import { useState, useEffect } from "react";
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
import { Mail, ArrowRight, StopCircle, Check, X, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClassStatusCellProps {
  classType: string;
  clientId: string;
  initialStatus?: 'completed' | 'passed' | 'no_pass' | 'incomplete' | 'did_not_grade' | 'did_not_attend' | 'interested' | 'not-interested' | null;
  initialPeriod?: string;
  initialPassPercentage?: number | null;
  initialNextAction?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
  initialNotes?: string;
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
  className
}: ClassStatusCellProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [passPercentage, setPassPercentage] = useState<number | null>(initialPassPercentage);
  const [nextAction, setNextAction] = useState<string | null>(initialNextAction);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('handler_class_status')
        .upsert({
          handler_id: clientId,
          class_type: classType,
          result_status: status,
          period: period,
          pass_percentage: passPercentage,
          next_action: nextAction || 'none',
          result_notes: notes,
          completed: status === 'passed' || status === 'completed',
          completed_at: (status === 'passed' || status === 'completed') ? new Date().toISOString() : null,
        }, { 
          onConflict: 'handler_id,class_type',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('Error updating class status:', error);
        toast.error('Failed to update class status');
        return;
      }
      
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
                disabled={isLoading || !status}
                className="w-full"
                size="sm"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  }

  // Display compact status with indicators
  const displayText = passPercentage 
    ? `${passPercentage}%` 
    : period || status?.replace('_', ' ') || '';

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
          <div className="space-y-3">
            <div className="font-medium text-sm">{classType}</div>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Result</label>
              <Select 
                value={status}
                onValueChange={(value) => setStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
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
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
}
