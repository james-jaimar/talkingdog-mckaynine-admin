
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClassSortControls } from "./ClassSortControls";
import { ClassAvailabilityBadge } from "./ClassAvailabilityBadge";
import { ClassActionButtons } from "./ClassActionButtons";
import { calculateAvailableSlots } from "./utils/classSlotUtils";
import { ClassMetadataCell } from "./table/cells/ClassMetadataCell";
import { ClassRowProps } from "./types/class-row";

export function ClassTableRow({
  classItem,
  index,
  totalClasses,
  onMoveUp,
  onMoveDown,
  onEdit,
  isLoading = false,
  isMoving = false,
}: ClassRowProps) {
  const availableSlots = calculateAvailableSlots(classItem);
  
  return (
    <TableRow className={isMoving ? "bg-yellow-50 transition-colors" : undefined}>
      <TableCell>
        <ClassSortControls 
          index={index}
          totalClasses={totalClasses}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          isLoading={isLoading || isMoving}
        />
      </TableCell>
      <TableCell className="font-medium">{classItem.name}</TableCell>
      <TableCell>
        <Badge variant="outline">{classItem.level}</Badge>
      </TableCell>
      <ClassMetadataCell
        duration={classItem.duration}
        courseFee={classItem.course_fee}
        capacity={classItem.capacity}
        branchName={classItem.branches?.name}
      />
      <TableCell>
        <ClassAvailabilityBadge 
          availableSlots={availableSlots} 
          capacity={classItem.capacity} 
        />
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
