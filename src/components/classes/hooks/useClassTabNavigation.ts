
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useClassTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDraggingRef = useRef(false);
  const preventNextNavigationRef = useRef(false);
  
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

  // Update active tab when URL changes (only if not dragging)
  useEffect(() => {
    if (isDraggingRef.current || preventNextNavigationRef.current) {
      return;
    }
    
    const newActiveTab = getActiveTabFromPath();
    setActiveTab(newActiveTab);
  }, [location.pathname, getActiveTabFromPath]);

  // Handle tab click
  const handleTabClick = useCallback((tabValue: string, path: string) => {
    // Skip navigation if we're dragging
    if (isDraggingRef.current) return;
    
    // Update the state
    setActiveTab(tabValue);
    
    // Navigate to the path (replace rather than push to avoid history buildup)
    navigate(path, { replace: true });
  }, [navigate]);

  // Handle drag events
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  return {
    activeTab,
    setActiveTab,
    isDraggingRef,
    preventNextNavigationRef,
    handleTabClick,
    handleDragStart,
    isClassesPath: location.pathname.includes('/classes')
  };
}
