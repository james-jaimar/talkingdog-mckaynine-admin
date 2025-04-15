
import { ClassSchedule } from "./types/classSchedule";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { TableActionMenu } from "./TableActionMenu";

interface SchedulesTableContentProps {
  schedules: ClassSchedule[];
  onEdit: (schedule: ClassSchedule) => void;
  onDelete: (id: string) => void;
}

// ID of our special "No Trainer" record
const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';

export function SchedulesTableContent({ 
  schedules, 
  onEdit, 
  onDelete 
}: SchedulesTableContentProps) {
  // Helper function to format dates from the schedule
  const formatScheduleDate = (date: string) => {
    return format(new Date(date), 'PPP p');
  };

  // Helper to determine if a trainer is assigned
  const getTrainerDisplay = (schedule: ClassSchedule) => {
    // Check if this is our special "No Trainer" record
    if (schedule.trainer_id === NO_TRAINER_ID) {
      return "No Trainer";
    }
    
    // Check if trainer exists and has both first and last name
    if (schedule.trainer && schedule.trainer.first_name && schedule.trainer.last_name) {
      return `${schedule.trainer.first_name} ${schedule.trainer.last_name}`;
    }
    
    return "No Trainer";
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
            {getTrainerDisplay(schedule)}
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
