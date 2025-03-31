
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Class } from "./types/class";
import { Link } from "react-router-dom";
import { EditClassModal } from "./EditClassModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, MapPin } from "lucide-react";
import { useState } from "react";

export function ClassesTable() {
  const { currentBranch } = useBranch();
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          branches:branch_id (
            name
          )
        `);
      
      // Filter by branch if one is selected
      if (currentBranch) {
        query = query.eq('branch_id', currentBranch.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (Class & { branches: { name: string } })[];
    },
    enabled: !!currentBranch // Only run query when a branch is selected
  });
  
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    refetch();
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
            <TableHead>Class Name</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classItem) => (
            <TableRow key={classItem.id}>
              <TableCell className="font-medium">{classItem.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{classItem.level}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{classItem.duration} min</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{classItem.price}</span>
                </div>
              </TableCell>
              <TableCell>{classItem.capacity} dogs</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{classItem.branches?.name || 'Unknown'}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    as={Link}
                    to={`/classes/${classItem.id}/schedules`}
                  >
                    Schedules
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingClass(classItem);
                      setIsEditModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
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
