
export interface ClassRowProps {
  classItem: any;
  index: number;
  totalClasses: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (classItem: any) => void;
  isLoading?: boolean;
}
