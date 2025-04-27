
// This file is now replaced by useClassOrdering.ts
// Keeping this file as a compatability layer for any components that might still use it

import { useClassOrdering } from "./useClassOrdering";

export function useClassOrder() {
  const {
    isMoving,
    handleDragEnd
  } = useClassOrdering();
  
  // Provide backward compatibility methods
  const moveClassUp = (index: number) => {
    if (index > 0) {
      handleDragEnd(index, index - 1);
    }
  };
  
  const moveClassDown = (index: number) => {
    // The destination index is handled within handleDragEnd
    handleDragEnd(index, index + 1);
  };
  
  return {
    moveClassUp,
    moveClassDown,
    isLoading: isMoving
  };
}
