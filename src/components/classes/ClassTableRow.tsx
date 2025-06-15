
import { TableCell, TableRow } from "@/components/ui/table";
import { ClassActionButtons } from "./ClassActionButtons";
import { ClassMetadataCell } from "./table/cells/ClassMetadataCell";
import { ClassAvailabilityBadge } from "./ClassAvailabilityBadge";
import { formatCurrency } from "@/lib/formatters";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";
import { Draggable } from "react-beautiful-dnd";
import { useState } from "react";
import { DeleteClassDialog } from "./DeleteClassDialog";
import { ClosedBadge } from "./ClosedBadge";

interface ClassTableRowProps {
  classItem: ClassWithSchedules;
  index: number;
  totalClasses: number;
  onEdit: () => void;
  isLoading?: boolean;
  isMoving?: boolean;
}

export function ClassTableRow({ 
  classItem, 
  index, 
  totalClasses, 
  onEdit,
  isLoading = false,
  isMoving = false
}: ClassTableRowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Draggable draggableId={classItem.id} index={index}>
        {(provided, snapshot) => (
          <TableRow
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`
              ${snapshot.isDragging ? "shadow-lg bg-accent/50" : ""}
              ${isMoving ? "opacity-50" : ""}
              ${classItem.status === "closed" ? "bg-zinc-100 opacity-60" : ""}
              relative
            `}
            data-testid={`class-row-${classItem.id}`}
          >
            <TableCell 
              {...provided.dragHandleProps}
              className="cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center">
                <span className="text-sm font-mono text-muted-foreground mr-2">
                  {index + 1}
                </span>
                <div className="w-1 h-6 bg-gray-300 rounded"></div>
              </div>
            </TableCell>
            
            <ClassMetadataCell classItem={classItem} />
            
            <TableCell className="text-center">
              <span className="capitalize">{classItem.class_type}</span>
            </TableCell>
            
            <TableCell className="text-center">
              {classItem.duration} min
            </TableCell>
            
            <TableCell className="text-center">
              {formatCurrency(classItem.course_fee)}
            </TableCell>
            
            <TableCell className="text-center">
              {classItem.capacity}
            </TableCell>
            
            <TableCell className="text-center">
              {classItem.branches?.name || "Unknown"}
            </TableCell>
            
            <TableCell className="text-center">
              <ClassAvailabilityBadge classItem={classItem} />
            </TableCell>

            <TableCell className="text-center">
              {/* Only show the class status here */}
              {classItem.status === "closed" 
                ? <ClosedBadge /> 
                : <span className="inline-block bg-green-50 text-green-600 text-xs font-semibold rounded px-2 py-1">Open</span>
              }
            </TableCell>
            
            <TableCell className="text-right">
              <ClassActionButtons 
                classId={classItem.id} 
                onEdit={onEdit}
                onDelete={handleDelete}
                isClosed={classItem.status === "closed"}
              />
            </TableCell>
          </TableRow>
        )}
      </Draggable>
      
      <DeleteClassDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        classData={classItem}
      />
    </>
  );
}
