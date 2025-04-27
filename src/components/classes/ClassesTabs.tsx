
import { useLocation } from "react-router-dom";
import { Tabs } from "@/components/ui/tabs";
import { useBranch } from "@/context/BranchContext";
import { useClassOrdering } from "./hooks/useClassOrdering";
import { useAuth } from "@/context/auth";
import { useClassTabNavigation } from "./hooks/useClassTabNavigation";
import { TabsLoadingState } from "./tabs/TabsLoadingState";
import { TabsErrorState } from "./tabs/TabsErrorState";
import { ClassTabsList } from "./tabs/ClassTabsList";
import { useClassIdFromUrl } from "./hooks/useClassIdFromUrl";

export function ClassesTabs({ alwaysShow = false }) {
  const location = useLocation();
  const { currentBranch } = useBranch();
  const { user } = useAuth();
  
  const { orderedClasses, isLoading, error } = useClassOrdering();
  const { handleTabClick } = useClassTabNavigation();
  const currentClassId = useClassIdFromUrl();
  
  // Enhanced path detection to show tabs on more class-related pages
  const isClassRelatedPath = 
    location.pathname.includes('/class/') || 
    location.pathname.includes('/classes/') ||
    alwaysShow;

  if (isLoading) {
    return <TabsLoadingState />;
  }
  
  if (error) {
    return <TabsErrorState />;
  }
  
  // Don't render if no authentication or branch
  if (!currentBranch || !user || !orderedClasses || orderedClasses.length === 0) {
    return null;
  }
  
  // When on the classes page or alwaysShow is true, show all classes
  // This ensures we can see newly added classes even without schedules
  const displayClasses = alwaysShow ? orderedClasses : orderedClasses.filter(
    c => c.class_schedules && c.class_schedules.length > 0
  );
  
  // Don't render if no valid classes and not forced to show
  if (displayClasses.length === 0 && !isClassRelatedPath) {
    return null;
  }
  
  return (
    <div className="mt-4 overflow-x-auto bg-gray-100 rounded-md p-1">
      <Tabs value={currentClassId || ""} className="w-full">
        <ClassTabsList
          classes={displayClasses as any}
          currentClassId={currentClassId}
          onTabClick={handleTabClick}
        />
      </Tabs>
    </div>
  );
}
