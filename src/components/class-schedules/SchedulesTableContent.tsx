
import { ClassSchedule } from "./types/classSchedule";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { TableActionMenu } from "./TableActionMenu";
import { Badge } from "@/components/ui/badge";

interface SchedulesTableContentProps {
  schedules: ClassSchedule[];
  onEdit: (schedule: ClassSchedule) => void;
  onDelete: (id: string, multiTermRelationId?: string) => void;
  currentTermId?: string;
}

// ID of our special "No Trainer" record
const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';

export function SchedulesTableContent({ 
  schedules, 
  onEdit, 
  onDelete,
  currentTermId
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

  // Helper to display term information
  const getTermDisplay = (schedule: ClassSchedule) => {
    let termInfo = "";
    
    // Try to get term information
    if (schedule.term && schedule.term.term_number && schedule.term.academic_year) {
      termInfo = `Term ${schedule.term.term_number}/${schedule.term.academic_year.year}`;
    } else if (schedule.term_number && schedule.academic_year) {
      termInfo = `Term ${schedule.term_number}/${schedule.academic_year}`;
    } else {
      termInfo = "No Term";
    }
    
    // If this is a multi-term schedule, add a badge
    if (schedule.spans_multiple_terms) {
      const isCurrentTerm = schedule.term_id === currentTermId;
      
      return (
        <div className="flex items-center gap-2">
          <span>{termInfo}</span>
          <Badge variant={isCurrentTerm ? "default" : "outline"} className="text-xs">
            {isCurrentTerm ? "This Term" : "Multi-Term"}
          </Badge>
        </div>
      );
    }
    
    return termInfo;
  };

  if (schedules.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          No schedules found. Add a new schedule to get started.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {schedules.map((schedule) => (
        <TableRow key={schedule.id} className={schedule.term_id !== currentTermId ? "bg-gray-50" : ""}>
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
            {getTermDisplay(schedule)}
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
              onDelete={() => onDelete(schedule.id, schedule.multi_term_relation_id)} 
            />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
