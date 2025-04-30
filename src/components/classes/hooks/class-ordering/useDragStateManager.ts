
import { useState, useCallback } from "react";

/**
 * Hook for managing drag state for class ordering
 */
export function useDragStateManager() {
  const [isDragging, setIsDragging] = useState(false);

  // Handle the start of drag operations
  const handleDragStart = useCallback(() => {
    console.log("Drag started");
    setIsDragging(true);
  }, []);
  
  return {
    isDragging,
    setIsDragging,
    handleDragStart
  };
}
