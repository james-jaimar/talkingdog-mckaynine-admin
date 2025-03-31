
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Class } from "./types/class";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const isDraggingRef = useRef(false);
  const preventNextNavigationRef = useRef(false);
  
  // Only display the class tabs on the classes page or class-related pages
  if (!location.pathname.includes('/classes')) {
    return null;
  }
  
  // Determine active tab from URL path
  const getActiveTabFromPath = () => {
    const classIdMatch = location.pathname.match(/\/classes\/([^/]+)/);
    if (classIdMatch) {
      return classIdMatch[1];
    }
    return "all";
  };
  
  // Initialize active tab state from URL
  const [activeTab, setActiveTab] = useState<string>(getActiveTabFromPath());
  
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
  const { data: savedOrder, isLoading: isLoadingOrder } = useQuery({
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
    if (!activeClasses || activeClasses.length === 0 || isLoadingOrder) return;
    
    console.log("Setting up ordered classes", { savedOrder, activeClasses });
    
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
  }, [activeClasses, savedOrder, isLoadingOrder, currentBranch?.id]);

  // Update active tab when URL changes (only if not dragging)
  useEffect(() => {
    if (isDraggingRef.current || preventNextNavigationRef.current) {
      return;
    }
    
    const newActiveTab = getActiveTabFromPath();
    setActiveTab(newActiveTab);
  }, [location.pathname]);

  // Handle tab click
  const handleTabClick = useCallback((tabValue: string, path: string) => {
    // Skip navigation if we're dragging
    if (isDraggingRef.current) return;
    
    // Update the state
    setActiveTab(tabValue);
    
    // Navigate to the path (replace rather than push to avoid history buildup)
    navigate(path, { replace: true });
  }, [navigate]);

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

  // Handle drag events
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback((result: any) => {
    // If there's no destination, don't do anything
    if (!result.destination) {
      isDraggingRef.current = false;
      return;
    }
    
    // Get the old and new indexes from the drag event
    const oldIndex = result.source.index;
    const newIndex = result.destination.index;
    
    // Reorder the array of classes
    const items = Array.from(orderedClasses);
    const [reorderedItem] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, reorderedItem);
    
    // Update state with the reordered items
    setOrderedClasses(items);
    
    // Save the new order to the database
    saveOrderToDatabase(items);
    
    // Set a flag to prevent the next navigation
    if (reorderedItem.id === activeTab) {
      preventNextNavigationRef.current = true;
      
      // Clear the flag after a short delay
      setTimeout(() => {
        preventNextNavigationRef.current = false;
      }, 100);
    }
    
    // Reset the dragging state
    isDraggingRef.current = false;
    
    // Show toast after successful reordering
    toast({
      title: "Class order updated",
      description: "The order of class tabs has been updated and saved."
    });
  }, [orderedClasses, activeTab, toast, saveOrderToDatabase]);

  if (isLoading) {
    return null;
  }
  
  // If we have no active classes, don't render
  if (activeClasses.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 mt-2 overflow-x-auto">
      <Tabs value={activeTab} className="w-full">
        <DragDropContext 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="class-tabs" direction="horizontal">
            {(provided) => (
              <TabsList 
                className="w-max min-w-full justify-start"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <TabsTrigger 
                  value="all" 
                  onClick={() => handleTabClick("all", "/classes")}
                  className={cn(
                    location.pathname === "/classes" ? "font-medium" : ""
                  )}
                >
                  All Classes
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
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        onClick={() => handleTabClick(classItem.id, `/classes/${classItem.id}/handlers`)}
                        className={cn(
                          "flex items-center gap-1",
                          location.pathname.includes(`/classes/${classItem.id}`) ? "font-medium" : ""
                        )}
                      >
                        <div 
                          {...provided.dragHandleProps}
                          className="cursor-grab px-1"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {classItem.name}
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
