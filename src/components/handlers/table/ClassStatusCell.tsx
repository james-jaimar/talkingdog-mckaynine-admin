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
import { useBranch } from "@/context/BranchContext";
import { Mail, MailCheck, ArrowRight, StopCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTermOptions } from "@/hooks/useTermOptions";
import { useClassTypes } from "@/hooks/useClassTypes";

interface ClassStatusItem {
  id?: string;
  class_type: string;
  status?: 'completed' | 'passed' | 'no_pass' | 'incomplete' | 'did_not_grade' | 'did_not_attend' | 'interested' | 'not-interested';
  period?: string;
  pass_percentage?: number | null;
  next_action?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
  action_completed?: boolean | null;
  result_notes?: string;
  next_class_type?: string | null;
  next_term_number?: string | null;
  next_term_year?: number | null;
  dog_name?: string | null;
  dog_id?: string | null;
  booking_id?: string | null;
}

interface DogInfo {
  id: string;
  name: string;
}

interface ClassStatusCellProps {
  classType: string;
  clientId: string;
  statuses: ClassStatusItem[];
  dogs: DogInfo[];
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

// Next class map is now built dynamically from useClassTypes inside StatusBox

// Single status box component
function StatusBox({
  classType,
  clientId,
  initialStatus,
  initialPeriod,
  initialPassPercentage,
  initialNextAction,
  initialNotes,
  initialNextClassType,
  initialNextTermNumber,
  initialNextTermYear,
  dogName,
  bookingId,
  statusId,
  initialDogId,
  initialActionCompleted,
  dogs,
  isAddNew = false,
}: {
  classType: string;
  clientId: string;
  initialStatus: string | null;
  initialPeriod: string;
  initialPassPercentage: number | null;
  initialNextAction: string | null;
  initialNotes: string;
  initialNextClassType: string | null;
  initialNextTermNumber: string | null;
  initialNextTermYear: number | null;
  dogName: string | null;
  bookingId: string | null;
  statusId: string | null;
  initialDogId: string | null;
  initialActionCompleted?: boolean | null;
  dogs: DogInfo[];
  isAddNew?: boolean;
}) {
  const { terms } = useTermOptions();
  const { classTypes: allClassTypes, classTypeNames } = useClassTypes(true);
  const nextClassMap: Record<string, string> = {};
  allClassTypes.forEach(ct => {
    if (ct.next_class_type) nextClassMap[ct.name] = ct.next_class_type;
  });
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [period, setPeriod] = useState<string>(initialPeriod);
  const [passPercentage, setPassPercentage] = useState<number | null>(initialPassPercentage);
  const [nextAction, setNextAction] = useState<string | null>(initialNextAction);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [nextClassType, setNextClassType] = useState<string | null>(initialNextClassType);
  const [nextTermNumber, setNextTermNumber] = useState<string | null>(initialNextTermNumber);
  const [nextTermYear, setNextTermYear] = useState<number | null>(initialNextTermYear);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(initialDogId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [wantsInfoClasses, setWantsInfoClasses] = useState<string[]>([]);
  
  // Update wantsInfoClasses default when nextClassMap loads
  useState(() => {
    const defaultNext = nextClassMap[classType];
    if (defaultNext && wantsInfoClasses.length === 0) {
      setWantsInfoClasses([defaultNext]);
    }
  });

  const selectedTermValue = nextTermNumber && nextTermYear 
    ? `${nextTermNumber}-${nextTermYear}` 
    : "";

  const handleTermChange = (value: string) => {
    const [termNum, year] = value.split("-");
    setNextTermNumber(termNum);
    setNextTermYear(parseInt(year));
  };

  // Get the selected dog's name for display
  const selectedDogName = selectedDogId 
    ? dogs.find(d => d.id === selectedDogId)?.name || dogName 
    : dogName;

  const handleUpdate = async () => {
    if (!clientId) return;
    
    // For new entries, require a dog to be selected if dogs are available
    if (isAddNew && dogs.length > 0 && !selectedDogId) {
      toast.error('Please select a dog');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use selectedDogId for new entries, or fall back to initialDogId
      const dogIdToUse = selectedDogId || initialDogId;
      
      const updateData: Record<string, any> = {
        handler_id: clientId,
        class_type: classType,
        booking_id: bookingId,
        dog_id: dogIdToUse, // Now we can store dog_id directly
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
      };

      let upsertedStatus;
      let error;

      // If we have a statusId, update the specific record
      if (statusId) {
        const result = await supabase
          .from('handler_class_status')
          .update(updateData)
          .eq('id', statusId)
          .select('id')
          .single();
        upsertedStatus = result.data;
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('handler_class_status')
          .insert(updateData)
          .select('id')
          .single();
        upsertedStatus = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error updating class status:', error);
        toast.error('Failed to update class status');
        return;
      }

      // Create task if next_action changed
      const actionChanged = nextAction !== initialNextAction;
      
      // Get dog context for task
      const taskDogId = selectedDogId || initialDogId;
      const taskDogName = selectedDogName;

      if (nextAction === 'wants_info' && actionChanged) {
        const classesForInfo = wantsInfoClasses.length > 0 ? wantsInfoClasses : [NEXT_CLASS_MAP[classType] || "next class"];
        const classesLabel = classesForInfo.join(", ");
        await supabase.from("handler_tasks").insert({
          handler_id: clientId,
          class_type: classType,
          class_status_id: upsertedStatus?.id,
          task_type: "send_info_pack",
          title: `Send ${classesLabel} info pack${taskDogName ? ` (${taskDogName})` : ''}`,
          description: `Handler completed ${classType}. Send information about ${classesLabel} class${classesForInfo.length > 1 ? 'es' : ''}.`,
          status: "pending",
          branch_id: currentBranch?.id || null,
          dog_id: taskDogId,
          dog_name: taskDogName,
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
          title: `Enroll in ${nextClass} - ${termInfo}${taskDogName ? ` (${taskDogName})` : ''}`,
          description: `Handler completed ${classType}. Follow up on enrollment for ${nextClass} in ${termInfo}.`,
          status: "pending",
          branch_id: currentBranch?.id || null,
          dog_id: taskDogId,
          dog_name: taskDogName,
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
  const isActionCompleted = initialActionCompleted === true;

  const renderActionIndicator = () => {
    if (!nextAction || nextAction === 'none') return null;
    const actionInfo = nextActionIcons[nextAction];
    if (!actionInfo) return null;

    // If action is completed, show a green MailCheck icon
    if (isActionCompleted) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 text-green-600">
                <MailCheck className="h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>✅ Info Sent</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

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

  const handleDelete = async () => {
    if (!statusId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('handler_class_status')
        .delete()
        .eq('id', statusId);
      
      if (error) {
        console.error('Error deleting class status:', error);
        toast.error('Failed to delete entry');
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
      toast.success('Entry deleted');
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Form content
  const renderFormContent = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">
          {classType}
        </div>
        {statusId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this class status entry? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      
      {/* Dog selector - always show when dogs available */}
      {dogs.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Dog</label>
          <Select 
            value={selectedDogId || ''}
            onValueChange={(value) => setSelectedDogId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select dog" />
            </SelectTrigger>
            <SelectContent>
              {dogs.map(dog => (
                <SelectItem key={dog.id} value={dog.id}>{dog.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
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

      {nextAction === 'wants_info' && (
        <div className="space-y-1 p-2 bg-blue-50 rounded-md">
          <label className="text-xs text-muted-foreground">Info for which class(es)?</label>
          <div className="flex flex-wrap gap-1">
            {classTypeNames.map((type) => (
              <Button
                key={type}
                type="button"
                variant={wantsInfoClasses.includes(type) ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setWantsInfoClasses(prev =>
                    prev.includes(type)
                      ? prev.filter(c => c !== type)
                      : [...prev, type]
                  );
                }}
              >
                {type}
              </Button>
            ))}
          </div>
          {wantsInfoClasses.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {wantsInfoClasses.join(", ")}
            </p>
          )}
        </div>
      )}

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
                {classTypeNames.map((type) => (
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

  // Display text and visuals
  const displayText = period || status?.replace('_', ' ') || '';

  if (!status) {
    return (
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
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "text-xs px-2 py-1 rounded border inline-flex flex-col items-center gap-0.5 w-full",
            resultStatusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200',
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-1">
            <span className="truncate max-w-[60px]">{displayText}</span>
            {renderActionIndicator()}
          </div>
          {passPercentage !== null && passPercentage !== undefined && (
            <span className="text-[10px] opacity-75">{passPercentage}%</span>
          )}
          {dogName && (
            <span className="text-[9px] opacity-60 truncate max-w-[70px]">{dogName}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        {renderFormContent()}
      </PopoverContent>
    </Popover>
  );
}

export function ClassStatusCell({ 
  classType, 
  clientId,
  statuses,
  dogs,
  className
}: ClassStatusCellProps) {
  // Filter out statuses with no actual status (empty placeholders)
  const validStatuses = statuses.filter(s => s.status);
  
  // Get dogs that already have a status for this class type
  const usedDogIds = validStatuses.map(s => s.dog_id).filter(Boolean);
  // Filter available dogs (those not yet used for this class type)
  const availableDogs = dogs.filter(d => !usedDogIds.includes(d.id));
  
  // If no valid statuses, show a single add button
  if (validStatuses.length === 0) {
    return (
      <TableCell className={cn("text-center p-1", className)}>
        <StatusBox
          classType={classType}
          clientId={clientId}
          initialStatus={null}
          initialPeriod=""
          initialPassPercentage={null}
          initialNextAction={null}
          initialNotes=""
          initialNextClassType={null}
          initialNextTermNumber={null}
          initialNextTermYear={null}
          dogName={null}
          bookingId={null}
          statusId={null}
          initialDogId={null}
          initialActionCompleted={false}
          dogs={dogs}
          isAddNew={true}
        />
      </TableCell>
    );
  }

  // Show all valid statuses stacked + always show add button for retakes
  return (
    <TableCell className={cn("text-center p-1", className)}>
      <div className="flex flex-col gap-1">
        {validStatuses.map((s, idx) => (
          <StatusBox
            key={`${s.booking_id || s.dog_id || idx}`}
            classType={classType}
            clientId={clientId}
            initialStatus={s.status || null}
            initialPeriod={s.period || ''}
            initialPassPercentage={s.pass_percentage ?? null}
            initialNextAction={s.next_action || null}
            initialNotes={s.result_notes || ''}
            initialNextClassType={s.next_class_type || null}
            initialNextTermNumber={s.next_term_number || null}
            initialNextTermYear={s.next_term_year ?? null}
            dogName={s.dog_name || null}
            bookingId={s.booking_id || null}
            statusId={s.id || null}
            initialDogId={s.dog_id || null}
            initialActionCompleted={s.action_completed}
            dogs={dogs}
          />
        ))}
        {/* Always show add button to allow retakes/multiple entries */}
        {dogs.length > 0 && (
          <StatusBox
            classType={classType}
            clientId={clientId}
            initialStatus={null}
            initialPeriod=""
            initialPassPercentage={null}
            initialNextAction={null}
            initialNotes=""
            initialNextClassType={null}
            initialNextTermNumber={null}
            initialNextTermYear={null}
            dogName={null}
            bookingId={null}
            statusId={null}
            initialDogId={null}
            initialActionCompleted={false}
            dogs={dogs}
            isAddNew={true}
          />
        )}
      </div>
    </TableCell>
  );
}
