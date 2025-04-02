
import { useLocation } from "react-router-dom";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { ClassTab } from "./ClassTab";
import { useBranch } from "@/context/BranchContext";
import { useClassTabOrder } from "./hooks/useClassTabOrder";
import { useClassesData } from "./hooks/useClassesData";
import { useClassTabNavigation } from "./hooks/useClassTabNavigation";
import { useAuth } from "@/context/auth";

export function ClassesTabs() {
  const location = useLocation();
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  const { activeClasses, isLoading, hasBranch, isAuthenticated, error } = useClassesData();
  
  // Get the ordered classes using our hook
  const { orderedClasses, isLoadingOrder } = useClassTabOrder(activeClasses, currentBranch?.id);

  // Use tab navigation hook
  const { handleTabClick, activeTab } = useClassTabNavigation();
  
  console.log("ClassesTabs - Current path:", location.pathname);
  console.log("ClassesTabs - Active tab:", activeTab);
  console.log("ClassesTabs - Auth state:", { user: !!user, session: !!session, isAuthenticated });
  console.log("ClassesTabs - Branch state:", { currentBranch, hasBranch });
  console.log("ClassesTabs - Classes data:", { activeClasses, error });
  
  // Show loading state while fetching data
  if (isLoading || isLoadingOrder) {
    return <div className="mt-4 bg-gray-100 rounded-md p-3">Loading class tabs...</div>;
  }
  
  // Don't render anything if there are no active classes or user isn't authenticated
  if (!hasBranch || !isAuthenticated || orderedClasses.length === 0) {
    if (!isAuthenticated) {
      console.log("ClassesTabs - Not rendering because user is not authenticated");
    }
    if (!hasBranch) {
      console.log("ClassesTabs - Not rendering because no branch is selected");
    }
    if (orderedClasses.length === 0) {
      console.log("ClassesTabs - Not rendering because no active classes found");
    }
    return null;
  }
  
  // Extract the current class ID from the URL
  let currentClassId = null;
  
  // Check for class ID in various path patterns
  const classesMatch = location.pathname.match(/\/classes\/([^/]+)$/);
  const schedulesMatch = location.pathname.match(/\/classes\/([^/]+)\/schedules/);
  const handlersMatch = location.pathname.match(/\/classes\/([^/]+)\/handlers/);
  
  if (classesMatch && classesMatch[1]) {
    currentClassId = classesMatch[1];
  } else if (schedulesMatch && schedulesMatch[1]) {
    currentClassId = schedulesMatch[1];
  } else if (handlersMatch && handlersMatch[1]) {
    currentClassId = handlersMatch[1];
  }
  
  console.log("ClassesTabs - Extracted currentClassId:", currentClassId);
  
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
