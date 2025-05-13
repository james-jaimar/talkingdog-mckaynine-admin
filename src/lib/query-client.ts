
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds default stale time
      retry: 1,
      refetchOnReconnect: true,
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  },
});

// Debounce mechanism for invalidating related data
let invalidationTimer: NodeJS.Timeout | null = null;
let isInvalidating = false;

// Global function to invalidate all term-related data
export async function invalidateTermRelatedData() {
  // If there's already an invalidation in progress, cancel it
  if (invalidationTimer) {
    clearTimeout(invalidationTimer);
  }
  
  // Set up a new debounced invalidation
  return new Promise<void>((resolve, reject) => {
    invalidationTimer = setTimeout(async () => {
      if (isInvalidating) {
        resolve(); // Another invalidation is already in progress
        return;
      }
      
      try {
        isInvalidating = true;
        
        // First, remove cached data to ensure fresh fetch
        await queryClient.removeQueries({ queryKey: ['classes'], exact: false });
        await queryClient.removeQueries({ queryKey: ['class-schedules'], exact: false });
        await queryClient.removeQueries({ queryKey: ['dashboard-stats'], exact: false });
        
        // Then trigger refetches
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['classes'], exact: false }),
          queryClient.refetchQueries({ queryKey: ['dashboard-stats'], exact: false })
        ]);
        
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        isInvalidating = false;
        invalidationTimer = null;
      }
    }, 100); // Short delay to allow batching of invalidation requests
  });
}
