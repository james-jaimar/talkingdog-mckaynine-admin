
import { Button } from "@/components/ui/button";
import { Plus, CalendarRange } from "lucide-react";

interface TableActionsProps {
  onBatchAttendanceOpen: () => void;
  isMobile: boolean;
}

export function TableActions({ onBatchAttendanceOpen, isMobile }: TableActionsProps) {
  return (
    <div className="mb-4 flex justify-end">
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
