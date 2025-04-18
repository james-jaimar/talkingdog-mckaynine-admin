
import { Class } from "./class";

export interface ClassRowProps {
  classItem: Class;
  index: number;
  totalClasses: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (classItem: Class) => void;
  isLoading?: boolean;
  isMoving?: boolean;
}
