
import { useTerm } from "@/context/TermContext";

/**
 * Backward compatibility hook for the old useTermSelection
 * This allows existing components to work without major refactoring
 */
export function useTermSelection() {
  // Simply return the same data structure from useTerm
  const termContext = useTerm();
  
  return {
    termData: termContext.termData,
    termDateRange: termContext.termDateRange,
    isTermLoading: termContext.isTermLoading,
    error: termContext.error
  };
}
