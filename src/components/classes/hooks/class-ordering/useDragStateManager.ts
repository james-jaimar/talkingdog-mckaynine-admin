
import { useState, useCallback } from "react";
import { OnDragStartResponder } from "react-beautiful-dnd";
import { useTerm } from "@/context/TermContext";

export function useDragStateManager() {
  const [isDragging, setIsDragging] = useState(false);
  const { termData } = useTerm();
  
  // Handle drag start
  const handleDragStart: OnDragStartResponder = useCallback((start) => {
    console.log("Drag started:", start);
    console.log("Current term:", termData?.term_number, termData?.academic_years?.year);
    setIsDragging(true);
  }, [termData]);
  
  return {
    isDragging,
    setIsDragging,
    handleDragStart
  };
}
