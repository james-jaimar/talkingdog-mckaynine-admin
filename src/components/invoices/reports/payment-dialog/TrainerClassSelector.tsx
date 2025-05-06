
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ClassTable } from "./ClassTable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogTrainerClassDetail } from "./types";

interface TrainerClassSelectorProps {
  classes: DialogTrainerClassDetail[];
  selectedIds: string[];
  onToggleClass: (scheduleId: string, selected: boolean) => void;
  onToggleAll: () => void;
  isDisabled?: boolean;
}

export function TrainerClassSelector({ 
  classes,
  selectedIds,
  onToggleClass,
  onToggleAll,
  isDisabled
}: TrainerClassSelectorProps) {
  // Filter classes to only show unpaid ones
  const unpaidClasses = classes.filter(cls => !cls.isPaid);
  const allSelected = unpaidClasses.length > 0 && 
                     unpaidClasses.every(cls => selectedIds.includes(cls.scheduleId));
  
  // Count paid vs unpaid classes
  const paidCount = classes.filter(cls => cls.isPaid).length;
  const unpaidCount = classes.filter(cls => !cls.isPaid).length;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="select-all"
            checked={unpaidClasses.length > 0 && allSelected} 
            onCheckedChange={() => onToggleAll()} 
            disabled={isDisabled || unpaidClasses.length === 0}
          />
          <label 
            htmlFor="select-all" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select all unpaid classes
          </label>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {unpaidCount} unpaid, {paidCount} paid
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <ClassTable 
          classDetails={classes}
          selectedClasses={selectedIds}
          toggleClass={onToggleClass}
        />
      </ScrollArea>
    </div>
  );
}
