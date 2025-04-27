
import { useState, useEffect } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ClassTableRow } from "./ClassTableRow";
import { useClassOrdering } from "./hooks/useClassOrdering";
import { EditClassModal } from "./EditClassModal";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { ClassesTableLoading } from "./table/ClassesTableLoading";
import { ClassesTableError } from "./table/ClassesTableError";
import { ClassesTableEmpty } from "./table/ClassesTableEmpty";
import { ClassesTableHeader } from "./table/ClassesTableHeader";
import { useTerm } from "@/context/TermContext";
import { toast } from "@/components/ui/use-toast";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";

export function ClassesTable() {
  const { 
    orderedClasses, 
    isLoading, 
    isMoving,
    isItemMoving,
    error, 
    handleReorder,
    pendingMovements,
    refetch
  } = useClassOrdering();
  const [editingClass, setEditingClass] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  
  // Make sure we refetch classes when the term changes
  useEffect(() => {
    console.log("Term changed, refreshing classes");
    refetch();
  }, [termData?.id, refetch]);
  
  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      setEditingClass(null);
    }, 300);
  };
  
  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['classes', currentBranch?.id] });
    queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
    handleCloseModal();
  };
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    console.log(`Drag ended: from ${sourceIndex} to ${destinationIndex}`);
    handleReorder(sourceIndex, destinationIndex);
  };

  if (isLoading) {
    return <ClassesTableLoading />;
  }
  
  if (error) {
    return <ClassesTableError error={error} onRetry={() => refetch()} />;
  }

  // Filter classes to only show those that have schedules matching the current term
  const displayClasses = orderedClasses?.filter(classItem => 
    !termData?.id || classItem.class_schedules?.some(schedule => schedule.term_id === termData?.id)
  );
  
  if (!displayClasses || displayClasses.length === 0) {
    return <ClassesTableEmpty />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0 overflow-auto">
          {(isMoving || pendingMovements > 0) && (
            <div className="bg-yellow-50 text-yellow-800 p-2 text-xs text-center">
              Saving class order...
            </div>
          )}
          <DragDropContext onDragEnd={onDragEnd}>
            <Table>
              <ClassesTableHeader />
              <Droppable droppableId="classes">
                {(provided) => (
                  <TableBody
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {displayClasses.map((classItem, index) => (
                      <ClassTableRow
                        key={classItem.id}
                        classItem={classItem as any}
                        index={index}
                        totalClasses={displayClasses.length}
                        onEdit={() => handleEdit(classItem)}
                        isLoading={isMoving}
                        isMoving={isItemMoving(classItem.id)}
                      />
                    ))}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </CardContent>
      </Card>
      
      <EditClassModal
        open={isEditModalOpen}
        onOpenChange={handleCloseModal}
        classData={editingClass}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
