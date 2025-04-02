
import { format } from "date-fns";
import { ClassSchedule } from "./types/classSchedule";
import { TableActionMenu } from "./TableActionMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface SchedulesTableContentProps {
  schedules: ClassSchedule[];
  onEdit: (schedule: ClassSchedule) => void;
  onDelete: (id: string) => void;
}

export function SchedulesTableContent({ schedules, onEdit, onDelete }: SchedulesTableContentProps) {
  if (schedules.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="p-4 text-center text-muted-foreground">
          No schedules found. Click "Add Schedule" to create one.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {schedules.map((schedule) => (
        <TableRow key={schedule.id}>
          <TableCell>{format(new Date(schedule.start_time), "PPp")}</TableCell>
          <TableCell>{format(new Date(schedule.end_time), "PPp")}</TableCell>
          <TableCell>
            {schedule.trainer 
              ? `${schedule.trainer.first_name} ${schedule.trainer.last_name}`
              : "Not assigned"}
          </TableCell>
          <TableCell>{schedule.recurring ? "Yes" : "No"}</TableCell>
          <TableCell>{schedule.recurrence_pattern || "N/A"}</TableCell>
          <TableCell>
            <TableActionMenu 
              schedule={schedule} 
              onEdit={onEdit} 
              onDelete={onDelete}
            />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
