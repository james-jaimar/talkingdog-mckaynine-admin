
import { useEffect } from "react";
import { useTerm } from "@/context/TermContext";
import { useQueryClient } from "@tanstack/react-query";

// Enable this for detailed debug logs, should be false in production
const DEBUG_LOGGING = false;

const logDebug = (...args: any[]) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

/**
 * Hook to handle term changes and reset state when needed
 */
export function useTermChangeHandler(
  branchId: string | undefined,
  lastTermId: React.MutableRefObject<string | undefined>,
  resetFn: () => void
) {
  const queryClient = useQueryClient();
  const { termData } = useTerm();

  // Reset when term changes to get fresh data
  useEffect(() => {
    if (termData?.id !== lastTermId.current) {
      logDebug("Term changed in useClassOrdering, resetting state", { 
        from: lastTermId.current, 
        to: termData?.id,
        selectedTerm: termData?.termNumber,
        selectedYear: termData?.year
      });
      
      // Call the reset function
      resetFn();
      lastTermId.current = termData?.id;
      
      // Reset the query cache for classes, more selective reset
      queryClient.invalidateQueries({
        queryKey: ['classes', branchId, lastTermId.current],
        exact: true
      });
    }
  }, [
    termData?.id, 
    resetFn, 
    queryClient,
    termData?.termNumber,
    termData?.year,
    branchId,
    lastTermId
  ]);
  
  return { currentTermId: termData?.id };
}
