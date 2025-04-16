
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { EditClassModal } from "./EditClassModal";
import { useClassesTableData } from "./hooks/useClassesTableData";
import { ClassTableRow } from "./ClassTableRow";
import { useClassOrder } from "./hooks/useClassOrder";

interface ClassesTableProps {
  filter?: string;
}

export function ClassesTable({ filter }: ClassesTableProps = {}) {
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { classes, orderedClasses, isLoading, refetch } = useClassesTableData(filter);
  const { moveClassUp, moveClassDown } = useClassOrder();

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    refetch();
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setIsEditModalOpen(true);
  };

  // Dedicated handlers for move operations
  const handleMoveUp = (index: number) => {
    moveClassUp(index);
  };

  const handleMoveDown = (index: number) => {
    moveClassDown(index);
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <p>Loading classes...</p>
      </div>
    );
  }
  
  if (!classes || classes.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50">
        <p className="text-muted-foreground">No classes found. Create your first class to get started.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Order</TableHead>
            <TableHead>Class Name</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Available Slots</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderedClasses.map((classItem, index) => (
            <ClassTableRow
              key={classItem.id}
              classItem={classItem}
              index={index}
              totalClasses={orderedClasses.length}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={handleEdit}
            />
          ))}
        </TableBody>
      </Table>

      {editingClass && (
        <EditClassModal 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          classData={editingClass} 
          onSuccess={handleEditSuccess} 
        />
      )}
    </>
  );
}
