
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateTermRelatedData } from "@/lib/query-client";

export function useTermCacheInvalidation(termId: string | undefined) {
  const queryClient = useQueryClient();
  
  // When term changes, invalidate related queries
  useEffect(() => {
    if (termId) {
      console.log(`Term changed to ID: ${termId}, invalidating related data...`);
      invalidateTermRelatedData()
        .then(() => console.log("Term-related cache invalidation complete"))
        .catch(error => console.error("Error invalidating term-related cache:", error));
    }
  }, [termId, queryClient]);
  
  return null;
}
