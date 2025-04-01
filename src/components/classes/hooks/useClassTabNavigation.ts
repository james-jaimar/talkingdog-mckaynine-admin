
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useClassTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL path
  const getActiveTabFromPath = useCallback(() => {
    const classIdMatch = location.pathname.match(/\/classes\/([^/]+)/);
    if (classIdMatch) {
      return classIdMatch[1];
    }
    return "all";
  }, [location.pathname]);
  
  // Initialize active tab state from URL
  const [activeTab, setActiveTab] = useState<string>(getActiveTabFromPath());

  // Handle tab click
  const handleTabClick = useCallback((tabValue: string, path: string) => {
    // Update the state
    setActiveTab(tabValue);
    
    // Navigate to the path
    navigate(path);
  }, [navigate]);

  return {
    activeTab,
    setActiveTab,
    handleTabClick,
    isClassesPath: location.pathname.includes('/classes')
  };
}
