
import { useState } from "react";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useClassesTableData } from "./hooks/useClassesTableData";
import { ClassTableRow } from "./ClassTableRow";
import { useClassOrder } from "./hooks/useClassOrder";
import { EditClassModal } from "./EditClassModal";
import { Skeleton } from "@/components/ui/skeleton";

export function ClassesTable() {
  const { orderedClasses, isLoading, error } = useClassesTableData();
  const { moveClassUp, moveClassDown } = useClassOrder();
  const [editingClass, setEditingClass] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const handleEdit = (classItem: any) => {
    console.log("Editing class:", classItem);
    setEditingClass(classItem);
    setIsEditModalOpen(true);
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
  
  if (error || !orderedClasses) {
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
  
  if (orderedClasses.length === 0) {
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
      
      {/* Edit Class Modal */}
      <EditClassModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        classData={editingClass}
        onSuccess={() => {
          // Reset the editing class after successful update
          setEditingClass(null);
        }}
      />
    </>
  );
}
