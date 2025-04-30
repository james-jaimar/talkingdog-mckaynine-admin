
import { useState, useEffect } from "react";
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
import { useTerm } from "@/context/TermContext";
import { toast } from "@/components/ui/use-toast";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

export function ClassesTable() {
  const { 
    activeClasses,
    isLoading, 
    error, 
    refetch 
  } = useClassesData();
  
  const [editingClass, setEditingClass] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const [lastTermId, setLastTermId] = useState<string | undefined>(termData?.id);
  
  // Check if term has changed since last render
  useEffect(() => {
    if (termData?.id !== lastTermId) {
      console.log("ClassesTable: Term changed, refreshing data", {
        from: lastTermId,
        to: termData?.id
      });
      
      setLastTermId(termData?.id);
      setIsRefreshing(true);
      
      // Clear query cache for classes and related queries
      queryClient.resetQueries({ 
        queryKey: ['classes'],
        exact: false
      }).then(() => {
        // Force refetch when term changes
        refetch().finally(() => {
          setIsRefreshing(false);
          console.log("Classes data refreshed after term change", {
            termId: termData?.id,
            classes: activeClasses?.length || 0
          });
        });
      });
    }
  }, [termData?.id, lastTermId, refetch, queryClient, activeClasses?.length]);
  
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
    // Invalidate and refetch to ensure latest data
    queryClient.resetQueries({ 
      queryKey: ['classes'],
      exact: false
    });
    handleCloseModal();
    
    // Also invalidate any related queries to ensure we see the latest data
    queryClient.invalidateQueries({
      queryKey: ['class-schedules'],
      exact: false
    });
    
    // Force a new fetch after a brief delay
    setTimeout(() => {
      refetch();
    }, 300);
  };
  
  const handleDragEnd = (result: any) => {
    // This is a placeholder implementation for drag & drop functionality
    // Actual implementation would be added when needed
    console.log("Drag ended:", result);
  };
  
  // Show loading state if initially loading or during term change refresh
  if (isLoading || isRefreshing) {
    return <ClassesTableLoading />;
  }
  
  if (error) {
    return <ClassesTableError error={error} onRetry={() => refetch()} />;
  }

  // Ensure we have valid data to display
  // This now safely uses activeClasses which is already filtered by term
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
