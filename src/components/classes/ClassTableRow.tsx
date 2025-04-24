
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClassSortControls } from "./ClassSortControls";
import { ClassAvailabilityBadge } from "./ClassAvailabilityBadge";
import { ClassActionButtons } from "./ClassActionButtons";
import { calculateAvailableSlots } from "./utils/classSlotUtils";
import { ClassMetadataCell } from "./table/cells/ClassMetadataCell";
import { ClassRowProps } from "./types/class-row";
import { cn } from "@/lib/utils";

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
  
  // Add alternate row coloring
  const rowBackground = cn(
    index % 2 === 0 ? "bg-gray-50" : "bg-white", 
    isMoving ? "bg-yellow-50 transition-colors duration-300" : ""
  );
  
  return (
    <TableRow 
      className={rowBackground}
    >
      {/* Order column */}
      <TableCell>
        <ClassSortControls 
          index={index}
          totalClasses={totalClasses}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          isLoading={isLoading || isMoving}
        />
      </TableCell>
      
      {/* Class name column */}
      <TableCell className="font-medium">{classItem.name}</TableCell>
      
      {/* Level column */}
      <TableCell>
        <Badge variant="outline">{classItem.class_type}</Badge>
      </TableCell>
      
      {/* Duration, Price, Capacity through ClassMetadataCell */}
      <ClassMetadataCell
        duration={classItem.duration}
        courseFee={classItem.course_fee}
        capacity={classItem.capacity}
      />
      
      {/* Location column */}
      <TableCell>{classItem.branches?.name || "-"}</TableCell>
      
      {/* Availability column */}
      <TableCell>
        <ClassAvailabilityBadge 
          availableSlots={availableSlots} 
          capacity={classItem.capacity} 
        />
      </TableCell>
      
      {/* Actions column */}
      <TableCell className="text-right">
        <ClassActionButtons 
          classId={classItem.id} 
          onEdit={() => onEdit(classItem)} 
        />
      </TableCell>
    </TableRow>
  );
}
