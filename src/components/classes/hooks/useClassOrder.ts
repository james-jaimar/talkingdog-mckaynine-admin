// This file is now replaced by useClassOrdering.ts
// Keeping this file as a compatability layer for any components that might still use it

import { useClassOrdering } from "./useClassOrdering";

export function useClassOrder() {
  const {
    moveClassUp,
    moveClassDown,
    isMoving
  } = useClassOrdering();
  
  return {
    moveClassUp,
    moveClassDown,
    isLoading: isMoving
  };
}
