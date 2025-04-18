
import { useState } from "react";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ClassTableRow } from "./ClassTableRow";
import { useClassOrdering } from "./hooks/useClassOrdering";
import { EditClassModal } from "./EditClassModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { Loader2 } from "lucide-react";

export function ClassesTable() {
  const { 
    orderedClasses, 
    isLoading, 
    isMoving,
    error, 
    moveClassUp, 
    moveClassDown 
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
    }, 300); // Small delay to allow modal animation to complete
  };
  
  const handleEditSuccess = () => {
    // Refresh data after successful edit
    queryClient.invalidateQueries({ queryKey: ['classes', currentBranch?.id] });
    queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
    handleCloseModal();
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading classes. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!orderedClasses || orderedClasses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No classes found. Add a new class to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0 overflow-auto">
          {isMoving && (
            <div className="bg-yellow-50 text-yellow-800 p-2 text-xs text-center">
              Saving class order...
            </div>
          )}
          <Table>
            <TableCaption>Active class configurations</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedClasses.map((classItem, index) => (
                <ClassTableRow
                  key={classItem.id}
                  classItem={classItem}
                  index={index}
                  totalClasses={orderedClasses.length}
                  onMoveUp={moveClassUp}
                  onMoveDown={moveClassDown}
                  onEdit={() => handleEdit(classItem)}
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
