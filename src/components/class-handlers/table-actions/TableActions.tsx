
import { Button } from "@/components/ui/button";
import { CalendarRange, UserRoundCog } from "lucide-react";

export interface TableActionsProps {
  onBatchAttendanceOpen: () => void;
  onSubstituteTrainerOpen?: () => void;
  isMobile: boolean;
}

export function TableActions({ onBatchAttendanceOpen, onSubstituteTrainerOpen, isMobile }: TableActionsProps) {
  return (
    <div className="mb-4 flex justify-end gap-2">
      {onSubstituteTrainerOpen && (
        <Button 
          onClick={onSubstituteTrainerOpen}
          className="flex items-center gap-2"
          variant="outline"
        >
          <UserRoundCog className="h-4 w-4" />
          <span className="hidden sm:inline">Substitute Trainers</span>
          <span className="sm:hidden">Subs</span>
        </Button>
      )}
      <Button 
        onClick={onBatchAttendanceOpen}
        className="flex items-center gap-2"
        variant="outline"
      >
        <CalendarRange className="h-4 w-4" />
        <span className="hidden sm:inline">Batch Attendance</span>
        <span className="sm:hidden">Attendance</span>
      </Button>
    </div>
  );
}
