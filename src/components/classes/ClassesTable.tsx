import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Class } from "./types/class";
import { Link } from "react-router-dom";
import { EditClassModal } from "./EditClassModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, MapPin, Users, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface ClassesTableProps {
  filter?: string;
}

export function ClassesTable({ filter }: ClassesTableProps = {}) {
  const { currentBranch } = useBranch();
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  // Get user's saved order
  const { data: savedOrder } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      try {
        if (!user) return null;

        const { data, error } = await (supabase
          .from('class_tab_order') as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('branch_id', currentBranch?.id || null)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching class order:", error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error("Error in fetchSavedOrder:", error);
        return null;
      }
    },
    enabled: !!currentBranch && !!user
  });

  // Order classes based on saved order or alphabetically
  const getOrderedClasses = () => {
    if (!classes) return [];
    
    if (savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      // First include ordered classes, then any others not in the order
      const orderedIds = new Set(savedOrder.class_ids);
      const orderedClasses = [
        ...savedOrder.class_ids
          .map(id => classes.find(c => c.id === id))
          .filter(Boolean),
        ...classes.filter(c => !orderedIds.has(c.id))
      ];
      return orderedClasses;
    }
    
    // Default alphabetical order
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  };

  let orderedClasses = getOrderedClasses();

  // Apply filter if provided
  if (filter) {
    orderedClasses = orderedClasses.filter(classItem => 
      classItem.id === filter
    );
  }

  // Save class order to database
  const saveClassOrderMutation = useMutation({
    mutationFn: async (classIds: string[]) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if order already exists for this user and branch
      const { data: existingOrder } = await (supabase
        .from('class_tab_order') as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('branch_id', currentBranch?.id || null)
        .maybeSingle();

      if (existingOrder) {
        // Update existing order
        const { error } = await (supabase
          .from('class_tab_order') as any)
          .update({ class_ids: classIds })
          .eq('id', existingOrder.id);
          
        if (error) throw error;
      } else {
        // Create new order
        const { error } = await (supabase
          .from('class_tab_order') as any)
          .insert({
            user_id: user.id,
            branch_id: currentBranch?.id || null,
            class_ids: classIds
          });
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
      // Also invalidate the classes tabs query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['active-classes', currentBranch?.id] });
    },
    onError: (error) => {
      console.error("Error saving class order:", error);
      toast({
        title: "Error",
        description: "Failed to save class order. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Move class up in the order
  const moveClassUp = (index: number) => {
    if (index <= 0) return; // Already at the top
    
    const newOrder = [...orderedClasses];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save class order.",
        variant: "destructive",
      });
      return;
    }
    
    saveClassOrderMutation.mutate(newOrder.map(c => c.id));
    
    toast({
      title: "Class moved up",
      description: "The class order has been updated.",
    });
  };

  // Move class down in the order
  const moveClassDown = (index: number) => {
    if (index >= orderedClasses.length - 1) return; // Already at the bottom
    
    const newOrder = [...orderedClasses];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save class order.",
        variant: "destructive",
      });
      return;
    }
    
    saveClassOrderMutation.mutate(newOrder.map(c => c.id));
    
    toast({
      title: "Class moved down",
      description: "The class order has been updated.",
    });
  };
  
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
            <TableHead className="w-16">Order</TableHead>
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
          {orderedClasses.map((classItem, index) => (
            <TableRow key={classItem.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => moveClassUp(index)}
                    disabled={index === 0 || !user}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => moveClassDown(index)}
                    disabled={index === orderedClasses.length - 1 || !user}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
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
                  <Link to={`/classes/${classItem.id}/schedules`}>
                    <Button variant="outline" size="sm">
                      Schedules
                    </Button>
                  </Link>
                  <Link to={`/classes/${classItem.id}/handlers`}>
                    <Button variant="outline" size="sm">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Handlers
                    </Button>
                  </Link>
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
