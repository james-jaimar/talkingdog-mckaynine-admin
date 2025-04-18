// This file is now replaced by useClassOrdering.ts
// Keeping this file as a compatability layer for any components that might still use it

import { useClassOrdering } from "./useClassOrdering";

export function useClassesTableData() {
  const {
    orderedClasses,
    originalClasses: classes,
    isLoading,
    error,
  } = useClassOrdering();
  
  return {
    classes,
    orderedClasses,
    isLoading,
    error
  };
}
