
import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth"; 

export function useClassTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  
  // Determine active tab from URL path
  const getActiveTabFromPath = useCallback(() => {
    // Check for class ID in the class detail path
    const classIdMatch = location.pathname.match(/\/class\/([^/]+)$/);
    if (classIdMatch) {
      return classIdMatch[1];
    }
    
    // Check for class ID in the class schedules path
    const scheduleMatch = location.pathname.match(/\/classes\/([^/]+)\/schedules/);
    if (scheduleMatch) {
      return scheduleMatch[1];
    }
    
    // Check for class ID in the class handlers path
    const handlersMatch = location.pathname.match(/\/class\/([^/]+)\/handlers/);
    if (handlersMatch) {
      return handlersMatch[1];
    }
    
    return "all";
  }, [location.pathname]);
  
  // Initialize active tab state from URL
  const [activeTab, setActiveTab] = useState<string>(getActiveTabFromPath());

  // Keep the active tab in sync with URL changes
  useEffect(() => {
    const currentTabFromPath = getActiveTabFromPath();
    if (currentTabFromPath !== activeTab) {
      setActiveTab(currentTabFromPath);
    }
  }, [location.pathname, getActiveTabFromPath, activeTab]);

  // Handle tab click
  const handleTabClick = useCallback((tabValue: string, path: string) => {
    console.log("Tab clicked:", tabValue, "path:", path);
    // Update the state
    setActiveTab(tabValue);
    
    // Navigate to the path
    navigate(path);
  }, [navigate]);

  return {
    activeTab,
    setActiveTab,
    handleTabClick,
    isClassesPath: location.pathname.includes('/classes') || location.pathname.includes('/class/'),
    isAuthenticated: !!user && !!session
  };
}
