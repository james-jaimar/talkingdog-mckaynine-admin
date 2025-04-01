
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Class } from "./types/class";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useClassTabOrder } from "./hooks/useClassTabOrder";
import { useClassTabNavigation } from "./hooks/useClassTabNavigation";
import { ClassTab } from "./ClassTab";

export function ClassesTabs() {
  const { currentBranch } = useBranch();
  
  const {
    activeTab,
    handleTabClick,
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
    isLoadingOrder,
  } = useClassTabOrder(activeClasses, currentBranch?.id);

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
        <TabsList className="w-max min-w-full justify-start bg-background/50 p-1">
          <TabsTrigger 
            value="all" 
            onClick={() => handleTabClick("all", "/classes")}
            className={cn(
              "px-4 py-2",
              location.pathname === "/classes" ? "font-medium bg-accent text-accent-foreground" : ""
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
        </TabsList>
      </Tabs>
    </div>
  );
}
