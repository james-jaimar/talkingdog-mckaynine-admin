
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
    handleDragStart,
    handleDragEnd,
    pendingMovements,
    refetch
  } = useClassOrdering();
  
  const [editingClass, setEditingClass] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { termData, selectedTermNumber, selectedYear } = useTerm();
  const [lastTermId, setLastTermId] = useState<string | undefined>(termData?.id);
  
  // Check if term has changed since last render
  useEffect(() => {
    if (termData?.id !== lastTermId) {
      console.log("ClassesTable: Term changed, refreshing data", {
        from: lastTermId,
        to: termData?.id,
        termNumber: selectedTermNumber,
        year: selectedYear
      });
      
      setLastTermId(termData?.id);
      setIsRefreshing(true);
      
      // Force refetch when term changes
      queryClient.invalidateQueries({ queryKey: ['classes'], exact: false }).then(() => {
        refetch().finally(() => {
          setIsRefreshing(false);
          console.log("Classes data refreshed after term change");
        });
      });
    }
  }, [termData?.id, selectedTermNumber, selectedYear, lastTermId, refetch, queryClient]);
  
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
    queryClient.invalidateQueries({ 
      queryKey: ['classes'],
      exact: false
    });
    handleCloseModal();
    
    // Also invalidate any related queries to ensure we see the latest data
    queryClient.invalidateQueries({
      queryKey: ['class-schedules'],
      exact: false
    });
  };
  
  // Handle drag and drop events from react-beautiful-dnd
  const onDragStart = () => {
    handleDragStart();
  };
  
  const onDragEnd = (result: DropResult) => {
    // Check if we have a valid destination
    if (!result.destination) {
      console.log("Dropped outside valid area");
      handleDragEnd(result.source.index, null);
      return;
    }
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    console.log(`Drag complete: from ${sourceIndex} to ${destinationIndex}`);
    handleDragEnd(sourceIndex, destinationIndex);
  };

  // Show loading state if initially loading or during term change refresh
  if (isLoading || isRefreshing) {
    return <ClassesTableLoading />;
  }
  
  if (error) {
    return <ClassesTableError error={error} onRetry={() => refetch()} />;
  }

  // In the classes management page, always show ALL classes regardless of term
  // This ensures newly added classes are visible
  const displayClasses = orderedClasses;
  
  console.log(`ClassesTable: Displaying ${displayClasses?.length || 0} classes, with term: ${termData?.id || 'none'}`);
  
  if (!displayClasses || displayClasses.length === 0) {
    return <ClassesTableEmpty />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0 overflow-auto relative">
          {(isMoving || pendingMovements > 0) && (
            <div className="bg-yellow-50 text-yellow-800 p-2 text-xs text-center sticky top-0 z-10 border-b border-yellow-100">
              Saving class order...
            </div>
          )}
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <Table>
              <ClassesTableHeader />
              <Droppable droppableId="classes-table-body">
                {(provided) => (
                  <TableBody
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="relative"
                    data-testid="classes-drag-container"
                  >
                    {displayClasses.map((classItem, index) => (
                      <ClassTableRow
                        key={classItem.id}
                        classItem={classItem as any}
                        index={index}
                        totalClasses={displayClasses.length}
                        onEdit={() => handleEdit(classItem)}
                        isLoading={isLoading}
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
