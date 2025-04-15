
import { ClassSchedule } from "./types/classSchedule";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { TableActionMenu } from "./TableActionMenu";

// Use the same constant as in useScheduleSubmit.ts
const NO_TRAINER_UUID = "00000000-0000-0000-0000-000000000000";

interface SchedulesTableContentProps {
  schedules: ClassSchedule[];
  onEdit: (schedule: ClassSchedule) => void;
  onDelete: (id: string) => void;
}

export function SchedulesTableContent({ 
  schedules, 
  onEdit, 
  onDelete 
}: SchedulesTableContentProps) {
  // Helper function to format dates from the schedule
  const formatScheduleDate = (date: string) => {
    return format(new Date(date), 'PPP p');
  };

  if (schedules.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="h-24 text-center">
          No schedules found. Add a new schedule to get started.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {schedules.map((schedule) => (
        <TableRow key={schedule.id}>
          <TableCell>
            {formatScheduleDate(schedule.start_time)}
          </TableCell>
          <TableCell>
            {formatScheduleDate(schedule.end_time)}
          </TableCell>
          <TableCell>
            {schedule.trainer_id === NO_TRAINER_UUID 
              ? "No Trainer" 
              : schedule.trainer 
                ? `${schedule.trainer.first_name} ${schedule.trainer.last_name}` 
                : "No Trainer"}
          </TableCell>
          <TableCell>
            {schedule.recurring ? "Yes" : "No"}
          </TableCell>
          <TableCell>
            {schedule.recurrence_pattern || "-"}
          </TableCell>
          <TableCell>
            <TableActionMenu 
              schedule={schedule}
              onEdit={() => onEdit(schedule)} 
              onDelete={() => onDelete(schedule.id)} 
            />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
