
import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function useClassTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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

  // Keep the active tab in sync with URL changes
  useEffect(() => {
    const currentTabFromPath = getActiveTabFromPath();
    if (currentTabFromPath !== activeTab) {
      setActiveTab(currentTabFromPath);
    }
  }, [location.pathname, getActiveTabFromPath, activeTab]);

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
    isClassesPath: location.pathname.includes('/classes'),
    isAuthenticated: !!user
  };
}
