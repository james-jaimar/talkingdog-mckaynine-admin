
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
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";

export function ClassesTable() {
  const { 
    activeClasses,
    isLoading, 
    error, 
    refetch 
  } = useClassesData();
  
  const [editingClass, setEditingClass] = useState<ClassWithSchedules | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  
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
  
  const handleDragEnd = (result: any) => {
    // This is a placeholder implementation for drag & drop functionality
    console.log("Drag ended:", result);
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

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
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
                    {Array.isArray(activeClasses) && activeClasses.map((classItem, index) => (
                      <ClassTableRow
                        key={classItem.id}
                        classItem={classItem}
                        index={index}
                        totalClasses={activeClasses.length}
                        onEdit={() => handleEdit(classItem)}
                        isLoading={isLoading}
                        isMoving={false}
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
      
      <EditClassModal
        open={isEditModalOpen}
        onOpenChange={handleCloseModal}
        classData={editingClass}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
