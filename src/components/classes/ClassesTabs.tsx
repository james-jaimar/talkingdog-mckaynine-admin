
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

export function ClassesTabs() {
  const { currentBranch } = useBranch();
  const location = useLocation();
  const { toast } = useToast();
  const initializedRef = useRef(false);
  
  const { data: classes, isLoading } = useQuery({
    queryKey: ['active-classes', currentBranch?.id],
    queryFn: async () => {
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

  // Initialize orderedClasses from activeClasses only once
  useEffect(() => {
    if (activeClasses.length > 0 && !initializedRef.current) {
      setOrderedClasses([...activeClasses]);
      initializedRef.current = true;
    }
  }, [activeClasses]);

  // Handle drag end event with proper state update
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    
    setOrderedClasses(prevState => {
      const items = Array.from(prevState);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      // Show toast after successful reordering
      toast({
        title: "Class order updated",
        description: "The order of class tabs has been updated."
      });
      
      return items;
    });
  }, [toast]);
  
  if (isLoading) {
    return null;
  }

  // Only display the class tabs on the classes page or class-related pages
  if (!location.pathname.includes('/classes')) {
    return null;
  }
  
  // If we have no active classes or haven't initialized the ordered classes yet, don't render
  if (activeClasses.length === 0 || orderedClasses.length === 0) {
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
