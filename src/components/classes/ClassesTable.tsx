
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Class } from "./types/class";
import { EditClassModal } from "./EditClassModal";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export function ClassesTable() {
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          branches:branch_id (name)
        `)
        .order("name");
      
      if (error) throw error;
      return data as Class[];
    },
  });

  const handleDeleteClass = async (id: string) => {
    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      toast({
        title: "Class deleted",
        description: "The class has been successfully deleted.",
      });
      
      refetch();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({
        title: "Error",
        description: "Failed to delete the class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClass = (classItem: Class) => {
    setClassToEdit(classItem);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading classes...</div>;
  }

  return (
    <div>
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left font-medium">Name</th>
              <th className="p-2 text-left font-medium">Level</th>
              <th className="p-2 text-left font-medium">Branch</th>
              <th className="p-2 text-left font-medium">Price</th>
              <th className="p-2 text-left font-medium">Duration (mins)</th>
              <th className="p-2 text-left font-medium">Capacity</th>
              <th className="p-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes && classes.length > 0 ? (
              classes.map((classItem) => (
                <tr key={classItem.id} className="border-b">
                  <td className="p-2">{classItem.name}</td>
                  <td className="p-2">{classItem.level}</td>
                  <td className="p-2">{classItem.branches?.name}</td>
                  <td className="p-2">${classItem.price.toFixed(2)}</td>
                  <td className="p-2">{classItem.duration}</td>
                  <td className="p-2">{classItem.capacity}</td>
                  <td className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditClass(classItem)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/class-schedules/${classItem.id}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClass(classItem.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  No classes found. Click "Add Class" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {classToEdit && (
        <EditClassModal 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          classData={classToEdit}
          onSuccess={() => {
            refetch();
            setClassToEdit(null);
          }}
        />
      )}
    </div>
  );
}
