
import { useEffect } from "react";
import { invalidateTermRelatedData } from "@/lib/query-client";

// Hook to automatically invalidate term-related data when the component mounts
export function useTermCacheInvalidation() {
  useEffect(() => {
    // This will ensure fresh term data is loaded
    invalidateTermRelatedData()
      .catch(error => {
        console.error("Error invalidating term-related data:", error);
      });
  }, []);
}
