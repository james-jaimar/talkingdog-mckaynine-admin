
import { Class } from "./class";

export interface ClassRowProps {
  classItem: Class;
  index: number;
  totalClasses?: number;
  onEdit: (classItem: Class) => void;
  isLoading?: boolean;
  isMoving?: boolean;
}
