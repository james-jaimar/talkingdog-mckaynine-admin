
import { ScheduleTableAlert } from "../ScheduleTableAlert";

interface SchedulesTableErrorProps {
  error: Error | unknown;
}

export function SchedulesTableError({ error }: SchedulesTableErrorProps) {
  return (
    <ScheduleTableAlert 
      message={`Error loading schedules: ${error instanceof Error ? error.message : "Unknown error"}`} 
      variant="error"
    />
  );
}
