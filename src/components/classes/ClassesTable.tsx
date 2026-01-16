import { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ClassTableRow } from "./ClassTableRow";
import { useClassesData } from "./hooks/useClassesData";
import { EditClassModal } from "./EditClassModal";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { ClassesTableLoading } from "./table/ClassesTableLoading";
import { ClassesTableError } from "./table/ClassesTableError";
import { ClassesTableEmpty } from "./table/ClassesTableEmpty";
import { ClassesTableHeader } from "./table/ClassesTableHeader";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";
import { toast } from "@/components/ui/use-toast";
import { MobileClassesList } from "./mobile/MobileClassesList";
import { useIsMobile } from "@/hooks/useIsMobile";
export function ClassesTable() {
  const { 
    activeClasses,
    isLoading, 
    error,
    isMoving,
    isItemMoving,
    refetch,
    handleDragStart,
    handleDragEnd: processDragEnd
  } = useClassesData();
  
  const [editingClass, setEditingClass] = useState<ClassWithSchedules | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const isMobile = useIsMobile();
  
  const handleEdit = (classItem: ClassWithSchedules) => {
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
    // Reset queries and close modal
    queryClient.invalidateQueries({ 
      queryKey: ['classes'],
      exact: false
    });
    
    handleCloseModal();
  };
  
  // Handle the drag end event from react-beautiful-dnd
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside the list or no movement
    if (!destination || source.index === destination.index) {
      return;
    }
    
    try {
      processDragEnd(source.index, destination.index);
    } catch (error) {
      console.error("Error processing drag end:", error);
      toast({
        title: "Error",
        description: "Failed to reorder classes. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return <ClassesTableLoading />;
  }
  
  if (error) {
    return <ClassesTableError error={error} onRetry={() => refetch()} />;
  }

  // Check for empty data
  if (!activeClasses || activeClasses.length === 0) {
    return <ClassesTableEmpty />;
  }

  // No filter: ALWAYS include closed classes in the list, so status is visible
  const sortedActiveClasses = activeClasses?.slice().sort((a, b) => {
    // Sort closed classes to the bottom of the list
    if (a.status === "closed" && b.status !== "closed") return 1;
    if (b.status === "closed" && a.status !== "closed") return -1;
    return 0;
  }) ?? [];

  return (
    <>
      {/* Mobile View */}
      {isMobile && (
        <MobileClassesList 
          classes={sortedActiveClasses} 
          onEdit={handleEdit} 
        />
      )}

      {/* Desktop View */}
      {!isMobile && (
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Card>
            <CardContent className="p-0 overflow-auto relative">
              <Table>
                <ClassesTableHeader />
                <Droppable droppableId="classes-table">
                  {(provided) => (
                    <TableBody 
                      className="relative" 
                      data-testid="classes-table-body"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {Array.isArray(sortedActiveClasses) && sortedActiveClasses.map((classItem, index) => (
                        <ClassTableRow
                          key={classItem.id}
                          classItem={classItem}
                          index={index}
                          totalClasses={sortedActiveClasses.length}
                          onEdit={() => handleEdit(classItem)}
                          isLoading={isLoading}
                          isMoving={isMoving || isItemMoving(classItem.id)}
                        />
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </Table>
            </CardContent>
          </Card>
        </DragDropContext>
      )}
      
      <EditClassModal
        open={isEditModalOpen}
        onOpenChange={handleCloseModal}
        classData={editingClass}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
