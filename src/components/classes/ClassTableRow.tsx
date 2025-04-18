
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { ClassSortControls } from "./ClassSortControls";
import { ClassAvailabilityBadge } from "./ClassAvailabilityBadge";
import { ClassActionButtons } from "./ClassActionButtons";
import { calculateAvailableSlots } from "./utils/classSlotUtils";

interface ClassTableRowProps {
  classItem: any;
  index: number;
  totalClasses: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (classItem: any) => void;
}

export function ClassTableRow({
  classItem,
  index,
  totalClasses,
  onMoveUp,
  onMoveDown,
  onEdit,
}: ClassTableRowProps) {
  const availableSlots = calculateAvailableSlots(classItem);
  
  return (
    <TableRow>
      <TableCell>
        <ClassSortControls 
          index={index}
          totalClasses={totalClasses}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </TableCell>
      <TableCell className="font-medium">{classItem.name}</TableCell>
      <TableCell>
        <Badge variant="outline">{classItem.level}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{classItem.duration} min</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span>R {classItem.course_fee}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{classItem.capacity} dogs</span>
        </div>
      </TableCell>
      <TableCell>
        <ClassAvailabilityBadge 
          availableSlots={availableSlots} 
          capacity={classItem.capacity} 
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{classItem.branches?.name || 'Unknown'}</span>
        </div>
      </TableCell>
      <TableCell>
        <ClassActionButtons 
          classId={classItem.id} 
          onEdit={() => onEdit(classItem)} 
        />
      </TableCell>
    </TableRow>
  );
}
