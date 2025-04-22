
import { useState } from "react";
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

export function ClassesTable() {
  const { 
    orderedClasses, 
    isLoading, 
    isMoving,
    isItemMoving,
    error, 
    moveClassUp, 
    moveClassDown,
    pendingMovements
  } = useClassOrdering();
  const [editingClass, setEditingClass] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  
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
  
  // Function to handle moving a class up based on index
  const handleMoveClassUp = (index: number) => {
    if (orderedClasses && index >= 0 && index < orderedClasses.length) {
      const classId = orderedClasses[index].id;
      moveClassUp(classId);
    }
  };
  
  // Function to handle moving a class down based on index
  const handleMoveClassDown = (index: number) => {
    if (orderedClasses && index >= 0 && index < orderedClasses.length) {
      const classId = orderedClasses[index].id;
      moveClassDown(classId);
    }
  };
  
  if (isLoading) {
    return <ClassesTableLoading />;
  }
  
  if (error) {
    return <ClassesTableError error={error} />;
  }
  
  if (!orderedClasses || orderedClasses.length === 0) {
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
          <Table>
            <ClassesTableHeader />
            <TableBody>
              {orderedClasses.map((classItem, index) => (
                <ClassTableRow
                  key={classItem.id}
                  classItem={classItem as any}
                  index={index}
                  totalClasses={orderedClasses.length}
                  onMoveUp={handleMoveClassUp}
                  onMoveDown={handleMoveClassDown}
                  onEdit={() => handleEdit(classItem)}
                  isLoading={isMoving}
                  isMoving={isItemMoving(classItem.id)}
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
