
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { ClassTab } from "./ClassTab";
import { useBranch } from "@/context/BranchContext";
import { useClassTabOrder } from "./hooks/useClassTabOrder";
import { useAuth } from "@/context/AuthContext";

// Define the type for activeClasses to match what we get from the query
interface ActiveClass {
  id: string;
  name: string;
  branches: { name: string };
  class_schedules: { id: string }[];
}

export function ClassesTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const { user, isAdmin, isTrainer } = useAuth();
  
  // Don't fetch if user doesn't have access
  const hasAccess = user && (isAdmin || isTrainer);
  
  // Fetch active classes (those that have schedules)
  const { data: activeClasses = [], isLoading } = useQuery({
    queryKey: ['active-classes', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch || !hasAccess) return [];
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          branches:branch_id (name),
          class_schedules:class_schedules (id)
        `)
        .eq('branch_id', currentBranch.id)
        // Only get classes that have schedules
        .not('class_schedules', 'is', null)
        .order('name');
      
      if (error) {
        console.error("Error fetching active classes:", error);
        throw error;
      }
      
      return data as ActiveClass[];
    },
    enabled: !!currentBranch && hasAccess,
  });
  
  // Get the ordered classes using our hook
  const { orderedClasses, isLoadingOrder } = useClassTabOrder(activeClasses, currentBranch?.id);
  
  if (isLoading || isLoadingOrder || !currentBranch || !hasAccess) {
    return null; // Don't render anything while loading or if no access
  }
  
  // Don't show tabs if there are no active classes
  if (orderedClasses.length === 0) {
    return null;
  }
  
  // Extract the current class ID from the URL
  const urlParts = location.pathname.split('/');
  const classIdIndex = urlParts.indexOf('classes') + 1;
  const currentClassId = classIdIndex < urlParts.length ? urlParts[classIdIndex] : null;
  
  // Handle tab click
  const handleTabClick = (tabValue: string, path: string) => {
    navigate(path);
  };
  
  return (
    <div className="mt-4 overflow-x-auto bg-gray-100 rounded-md p-1">
      <Tabs value={currentClassId || ""} className="w-full">
        <TabsList className="w-max min-w-full justify-start h-auto bg-transparent">
          {orderedClasses.map((classItem, index) => (
            <ClassTab
              key={classItem.id}
              classItem={classItem}
              index={index}
              isActive={classItem.id === currentClassId}
              onTabClick={handleTabClick}
            />
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
