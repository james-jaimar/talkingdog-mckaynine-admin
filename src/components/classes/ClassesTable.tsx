
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
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";

export function ClassesTable() {
  const { 
    activeClasses,
    allClasses, 
    isLoading, 
    error, 
    refetch 
  } = useClassesData();
  
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
            classes: allClasses?.length || 0
          });
        });
      });
    }
  }, [termData?.id, selectedTermNumber, selectedYear, lastTermId, refetch, queryClient, allClasses?.length]);
  
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
  
  // Show loading state if initially loading or during term change refresh
  if (isLoading || isRefreshing) {
    return <ClassesTableLoading />;
  }
  
  if (error) {
    return <ClassesTableError error={error} onRetry={() => refetch()} />;
  }

  // Use the appropriate classes data based on context
  // In this case, we'll use activeClasses - already filtered by term at database level
  const displayClasses = activeClasses;
  
  console.log(`ClassesTable: Displaying ${displayClasses?.length || 0} classes, filtered by term: ${termData?.id || 'none'}`);
  
  if (!displayClasses || displayClasses.length === 0) {
    return <ClassesTableEmpty />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0 overflow-auto relative">
          <Table>
            <ClassesTableHeader />
            <TableBody className="relative" data-testid="classes-table-body">
              {displayClasses.map((classItem, index) => (
                <ClassTableRow
                  key={classItem.id}
                  classItem={classItem as any}
                  index={index}
                  totalClasses={displayClasses.length}
                  onEdit={() => handleEdit(classItem)}
                  isLoading={isLoading}
                  isMoving={false}
                />
              ))}
            </TableBody>
          </Table>
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
