
import { useLocation } from "react-router-dom";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { ClassTab } from "./ClassTab";
import { useBranch } from "@/context/BranchContext";
import { useClassOrdering } from "./hooks/useClassOrdering";
import { useAuth } from "@/context/auth";
import { useClassTabNavigation } from "./hooks/useClassTabNavigation";
import { Skeleton } from "@/components/ui/skeleton";

export function ClassesTabs() {
  const location = useLocation();
  const { currentBranch } = useBranch();
  const { user } = useAuth();
  
  // Get the ordered classes using our new hook
  const { orderedClasses, isLoading, error } = useClassOrdering();

  // Use tab navigation hook
  const { handleTabClick, activeTab } = useClassTabNavigation();
  
  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="mt-4 bg-gray-100 rounded-md p-3">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="mt-4 bg-gray-100 rounded-md p-3 text-red-500 text-center">
        Error loading classes. Please refresh the page.
      </div>
    );
  }
  
  // Don't render anything if there are no classes or user isn't authenticated
  if (!currentBranch || !user || !orderedClasses || orderedClasses.length === 0) {
    return null;
  }
  
  // Extract the current class ID from the URL
  let currentClassId = null;
  
  // Check for class ID in various path patterns
  const classesMatch = location.pathname.match(/\/classes\/([^/]+)$/);
  const schedulesMatch = location.pathname.match(/\/classes\/([^/]+)\/schedules/);
  const handlersMatch = location.pathname.match(/\/class\/([^/]+)\/handlers/);
  
  if (classesMatch && classesMatch[1]) {
    currentClassId = classesMatch[1];
  } else if (schedulesMatch && schedulesMatch[1]) {
    currentClassId = schedulesMatch[1];
  } else if (handlersMatch && handlersMatch[1]) {
    currentClassId = handlersMatch[1];
  }
  
  // Only show classes that have schedules (for tabs)
  const classesWithSchedules = orderedClasses.filter(
    c => c.class_schedules && c.class_schedules.length > 0
  );
  
  // If no classes have schedules, don't render anything
  if (classesWithSchedules.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4 overflow-x-auto bg-gray-100 rounded-md p-1">
      <Tabs value={currentClassId || ""} className="w-full">
        <TabsList className="w-max min-w-full justify-start h-auto bg-transparent">
          {classesWithSchedules.map((classItem, index) => (
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
