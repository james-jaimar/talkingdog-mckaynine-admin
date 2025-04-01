
import { useLocation } from "react-router-dom";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { ClassTab } from "./ClassTab";
import { useBranch } from "@/context/BranchContext";
import { useClassTabOrder } from "./hooks/useClassTabOrder";
import { useClassesData } from "./hooks/useClassesData";
import { useClassTabNavigation } from "./hooks/useClassTabNavigation";

export function ClassesTabs() {
  const location = useLocation();
  const { currentBranch } = useBranch();
  const { activeClasses, isLoading, hasBranch } = useClassesData();
  
  // Get the ordered classes using our hook
  const { orderedClasses, isLoadingOrder } = useClassTabOrder(activeClasses, currentBranch?.id);

  // Use tab navigation hook
  const { handleTabClick } = useClassTabNavigation();
  
  // Show loading state while fetching data
  if (isLoading || isLoadingOrder) {
    return <div className="mt-4 bg-gray-100 rounded-md p-3">Loading class tabs...</div>;
  }
  
  // Don't render anything if there are no active classes
  if (!hasBranch || orderedClasses.length === 0) {
    return null;
  }
  
  // Extract the current class ID from the URL
  const urlParts = location.pathname.split('/');
  const classesIndex = urlParts.indexOf('classes');
  const currentClassId = (classesIndex >= 0 && urlParts.length > classesIndex + 1) 
    ? urlParts[classesIndex + 1] 
    : null;
  
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
