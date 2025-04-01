
import { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useClassTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDraggingRef = useRef(false);
  
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
    // Skip navigation if we're dragging
    if (isDraggingRef.current) return;
    
    // Update the state
    setActiveTab(tabValue);
    
    // Navigate to the path
    navigate(path);
  }, [navigate]);

  // Handle drag events
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    // Add a small delay to prevent immediate navigation after drag
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, []);

  return {
    activeTab,
    setActiveTab,
    isDraggingRef,
    handleTabClick,
    handleDragStart,
    handleDragEnd,
    isClassesPath: location.pathname.includes('/classes')
  };
}
