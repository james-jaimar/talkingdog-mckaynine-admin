
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClassAvailabilityBadge } from "./ClassAvailabilityBadge";
import { ClassActionButtons } from "./ClassActionButtons";
import { calculateAvailableSlots } from "./utils/classSlotUtils";
import { ClassMetadataCell } from "./table/cells/ClassMetadataCell";
import { ClassRowProps } from "./types/class-row";
import { cn } from "@/lib/utils";
import { Draggable } from "react-beautiful-dnd";
import { GripVertical } from "lucide-react";

export function ClassTableRow({
  classItem,
  index,
  onEdit,
  isLoading = false,
  isMoving = false,
}: ClassRowProps) {
  const availableSlots = calculateAvailableSlots(classItem);
  
  // Count unique handlers (client-dog pairs)
  const handlerCount = classItem.class_schedules?.reduce((count, schedule) => {
    return count + (schedule.bookings?.length || 0);
  }, 0) || 0;

  return (
    <Draggable 
      draggableId={classItem.id} 
      index={index} 
      isDragDisabled={isLoading || isMoving}
    >
      {(provided, snapshot) => (
        <TableRow 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            index % 2 === 0 ? "bg-gray-50" : "bg-alternate-row", 
            isMoving && "bg-yellow-50 transition-colors duration-300",
            snapshot.isDragging && "shadow-lg bg-blue-50 border border-blue-200"
          )}
          data-testid={`class-row-${classItem.id}`}
        >
          {/* Drag handle */}
          <TableCell width="40" className="w-[40px]">
            <div
              {...provided.dragHandleProps}
              className={cn(
                "flex items-center justify-center h-full cursor-grab active:cursor-grabbing",
                (isLoading || isMoving) && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Drag to reorder class"
            >
              <GripVertical 
                className={cn(
                  "h-5 w-5 text-gray-400",
                  snapshot.isDragging ? "text-blue-500" : ""
                )} 
              />
            </div>
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
            <div className="flex flex-col">
              <ClassAvailabilityBadge 
                availableSlots={availableSlots} 
                capacity={classItem.capacity} 
              />
              <span className="text-xs text-gray-500 mt-1">
                {handlerCount} {handlerCount === 1 ? 'handler' : 'handlers'}
              </span>
            </div>
          </TableCell>
          
          {/* Actions column */}
          <TableCell className="text-right">
            <ClassActionButtons 
              classId={classItem.id} 
              onEdit={() => onEdit(classItem)} 
            />
          </TableCell>
        </TableRow>
      )}
    </Draggable>
  );
}
