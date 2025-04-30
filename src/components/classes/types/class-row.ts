
import { ClassWithSchedules } from "../hooks/types/class-with-schedules";

export interface ClassRowProps {
  classItem: ClassWithSchedules;
  index: number;
  totalClasses?: number;
  onEdit: (classItem: ClassWithSchedules) => void;
  isLoading?: boolean;
  isMoving?: boolean;
}
