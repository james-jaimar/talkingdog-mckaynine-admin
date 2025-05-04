
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function ClassesTable() {
  const { 
    activeClasses,
    isLoading, 
    error,
    isMoving,
    isItemMoving,
    refetch,
    handleDragStart,
    handleDragEnd: processDragEnd,
    hasBranch,
    isAuthenticated
  } = useClassesData();
  
  const [editingClass, setEditingClass] = useState<ClassWithSchedules | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  
  // If no branch is selected, show a friendly message
  if (!hasBranch) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Please select a branch to view classes
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You need to be logged in to view classes
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
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

  return (
    <>
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
                    {Array.isArray(activeClasses) && activeClasses.map((classItem, index) => (
                      <ClassTableRow
                        key={classItem.id}
                        classItem={classItem}
                        index={index}
                        totalClasses={activeClasses.length}
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
      
      <EditClassModal
        open={isEditModalOpen}
        onOpenChange={handleCloseModal}
        classData={editingClass}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
