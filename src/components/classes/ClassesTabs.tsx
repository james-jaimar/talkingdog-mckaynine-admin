
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Class } from "./types/class";
import { Link, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define interface for class tab order data
interface ClassTabOrder {
  id: string;
  user_id: string;
  branch_id: string | null;
  class_ids: string[];
  created_at: string;
  updated_at: string;
}

export function ClassesTabs() {
  const { currentBranch } = useBranch();
  const location = useLocation();
  const { toast } = useToast();
  const initializedRef = useRef(false);
  
  // Only display the class tabs on the classes page or class-related pages
  if (!location.pathname.includes('/classes')) {
    return null;
  }
  
  // Query to fetch classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['active-classes', currentBranch?.id],
    queryFn: async () => {
      try {
        let query = supabase
          .from('classes')
          .select(`
            *,
            branches:branch_id (
              name
            ),
            class_schedules!inner(id)
          `)
          .order('name');
        
        // Filter by branch if one is selected
        if (currentBranch) {
          query = query.eq('branch_id', currentBranch.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data as (Class & { 
          branches: { name: string }, 
          class_schedules: { id: string }[] 
        })[];
      } catch (error) {
        console.error("Error fetching classes:", error);
        return [];
      }
    },
    enabled: true
  });
  
  // Filter to only include classes with schedules
  const activeClasses = classes?.filter(c => c.class_schedules.length > 0) || [];
  
  // State for storing the ordered list of classes
  const [orderedClasses, setOrderedClasses] = useState<(Class & { 
    branches: { name: string }, 
    class_schedules: { id: string }[] 
  })[]>([]);

  // Query to fetch saved class order from database
  const { data: savedOrder, refetch: refetchSavedOrder } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      try {
        // Check if we have a logged in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("No user logged in, cannot fetch saved order");
          return null;
        }

        // Use type assertion to bypass TypeScript's type checking
        const { data, error } = await (supabase
          .from('class_tab_order') as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('branch_id', currentBranch?.id || null)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
          console.error("Error fetching class order:", error);
          return null;
        }
        
        return data as ClassTabOrder | null;
      } catch (error) {
        console.error("Error in fetchSavedOrder:", error);
        return null;
      }
    },
    enabled: !!currentBranch
  });

  // Initialize ordered classes from database or default order
  useEffect(() => {
    if (!activeClasses || activeClasses.length === 0) return;
    
    if (initializedRef.current) return;
    
    console.log("Initializing ordered classes", { savedOrder, activeClasses });
    
    if (savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      // We have a saved order from the database
      const savedOrderIds = savedOrder.class_ids;
      
      // Map IDs to actual class objects and include any new classes at the end
      const existingClassIds = new Set(savedOrderIds);
      const orderedClassList = [
        // First, add classes in the saved order that still exist in activeClasses
        ...savedOrderIds
          .map(id => activeClasses.find(c => c.id === id))
          .filter(Boolean) as (Class & { 
            branches: { name: string }, 
            class_schedules: { id: string }[] 
          })[],
        // Then add any classes not in the saved order
        ...activeClasses.filter(c => !existingClassIds.has(c.id))
      ];
      
      setOrderedClasses(orderedClassList);
    } else {
      // If no saved order, use the default order
      setOrderedClasses([...activeClasses]);
    }
    
    initializedRef.current = true;
  }, [activeClasses, savedOrder]);

  // Save the order to database whenever it changes
  const saveOrderToDatabase = useCallback(async (newOrder: typeof orderedClasses) => {
    try {
      // Check if we have a logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user logged in, cannot save order");
        return;
      }

      const orderIds = newOrder.map(item => item.id);
      
      // Upsert the order (insert if not exists, update if exists)
      // Use type assertion to bypass TypeScript's type checking
      const { error } = await (supabase
        .from('class_tab_order') as any)
        .upsert({
          user_id: user.id,
          branch_id: currentBranch?.id || null,
          class_ids: orderIds
        }, {
          onConflict: 'user_id, branch_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error("Error saving class order:", error);
        toast({
          title: "Error saving order",
          description: "There was a problem saving your class order.",
          variant: "destructive"
        });
      } else {
        console.log("Successfully saved order to database");
      }
    } catch (error) {
      console.error("Error in saveOrderToDatabase:", error);
    }
  }, [currentBranch?.id, toast]);

  // Handle drag end event
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(orderedClasses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update state
    setOrderedClasses(items);
    
    // Save the new order to the database
    saveOrderToDatabase(items);
    
    // Show toast after successful reordering
    toast({
      title: "Class order updated",
      description: "The order of class tabs has been updated and saved."
    });
  }, [orderedClasses, toast, saveOrderToDatabase]);
  
  if (isLoading) {
    return null;
  }
  
  // If we have no active classes or haven't initialized the ordered classes yet, don't render
  if (activeClasses.length === 0 || !initializedRef.current) {
    return null;
  }

  return (
    <div className="mx-4 mt-2 overflow-x-auto">
      <Tabs defaultValue="all" className="w-full">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="class-tabs" direction="horizontal">
            {(provided) => (
              <TabsList 
                className="w-max min-w-full justify-start"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <TabsTrigger value="all" asChild>
                  <Link to="/classes" className={cn(
                    location.pathname === "/classes" ? "font-medium" : ""
                  )}>
                    All Classes
                  </Link>
                </TabsTrigger>
                
                {orderedClasses.map((classItem, index) => (
                  <Draggable 
                    key={classItem.id} 
                    draggableId={classItem.id} 
                    index={index}
                  >
                    {(provided) => (
                      <TabsTrigger 
                        value={classItem.id} 
                        asChild
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <Link 
                          to={`/classes/${classItem.id}/handlers`}
                          className={cn(
                            "flex items-center gap-1",
                            location.pathname === `/classes/${classItem.id}/handlers` ? "font-medium" : ""
                          )}
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="cursor-grab px-1"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {classItem.name}
                        </Link>
                      </TabsTrigger>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </TabsList>
            )}
          </Droppable>
        </DragDropContext>
      </Tabs>
    </div>
  );
}
