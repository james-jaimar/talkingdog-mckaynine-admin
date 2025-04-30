
import { useEffect } from "react";

// Enable this for detailed debug logs, should be false in production
const DEBUG_LOGGING = false;

/**
 * Log utility function for conditional logging
 */
export const logDebug = (...args: any[]) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

/**
 * Hook to log state changes for debugging
 */
export function useClassOrderingLogger(state: {
  branchId?: string;
  termId?: string;
  fetchedClassesCount: number;
  orderedClassesCount: number;
  hasInitialized: boolean;
  selectedTerm: string;
  selectedYear: number;
}) {
  useEffect(() => {
    logDebug("useClassOrdering state:", { 
      branchId: state.branchId,
      termId: state.termId,
      fetchedClassesCount: state.fetchedClassesCount,
      orderedClassesCount: state.orderedClassesCount,
      hasInitialized: state.hasInitialized,
      selectedTerm: state.selectedTerm,
      selectedYear: state.selectedYear
    });
  }, [state]);
}
