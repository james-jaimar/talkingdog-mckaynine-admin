
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Class } from "./types/class";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { useToast } from "@/hooks/use-toast";
import { useClassTabOrder } from "./hooks/useClassTabOrder";
import { useClassTabNavigation } from "./hooks/useClassTabNavigation";
import { ClassTab } from "./ClassTab";

export function ClassesTabs() {
  const { currentBranch } = useBranch();
  const { toast } = useToast();
  
  const {
    activeTab,
    isDraggingRef,
    handleTabClick,
    handleDragStart,
    handleDragEnd,
    isClassesPath
  } = useClassTabNavigation();
  
  // Only display the class tabs on the classes page or class-related pages
  if (!isClassesPath) {
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
  
  const {
    orderedClasses,
    setOrderedClasses,
    saveOrderToDatabase,
    isLoadingOrder
  } = useClassTabOrder(activeClasses, currentBranch?.id);

  const handleDragEndInternal = (result: DropResult) => {
    // Reset the dragging state
    handleDragEnd();
    
    // If there's no destination, do nothing
    if (!result.destination) {
      return;
    }
    
    // Get the old and new indexes from the drag event
    const oldIndex = result.source.index;
    const newIndex = result.destination.index;
    
    // If there's no change in position, do nothing
    if (oldIndex === newIndex) {
      return;
    }
    
    // Create a new array to avoid state mutations
    const items = Array.from(orderedClasses);
    const [reorderedItem] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, reorderedItem);
    
    // Update state with the reordered items
    setOrderedClasses(items);
    
    // Save the new order to the database immediately
    saveOrderToDatabase(items);
    
    // Show toast after successful reordering
    toast({
      title: "Class order updated",
      description: "The order of class tabs has been updated and saved."
    });
  };

  if (isLoading || isLoadingOrder) {
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
          onDragEnd={handleDragEndInternal}
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
                  <ClassTab
                    key={classItem.id}
                    classItem={classItem}
                    index={index}
                    isActive={location.pathname.includes(`/classes/${classItem.id}`)}
                    onTabClick={handleTabClick}
                  />
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
