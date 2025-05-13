
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
        console.log("🔄 Term changed - invalidating all term-related data...");
        
        // First, remove cached data to ensure fresh fetch
        await queryClient.removeQueries({ queryKey: ['classes'], exact: false });
        await queryClient.removeQueries({ queryKey: ['class-schedules'], exact: false });
        await queryClient.removeQueries({ queryKey: ['dashboard-stats'], exact: false });
        await queryClient.removeQueries({ queryKey: ['financial-bookings'], exact: false });
        await queryClient.removeQueries({ queryKey: ['invoices'], exact: false });
        await queryClient.removeQueries({ queryKey: ['recent-bookings'], exact: false });
        await queryClient.removeQueries({ queryKey: ['upcoming-classes'], exact: false });
        
        // Then trigger refetches
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['classes'], exact: false }),
          queryClient.refetchQueries({ queryKey: ['dashboard-stats'], exact: false }),
          queryClient.refetchQueries({ queryKey: ['financial-bookings'], exact: false }),
          queryClient.refetchQueries({ queryKey: ['invoices'], exact: false }),
          queryClient.refetchQueries({ queryKey: ['recent-bookings'], exact: false }),
          queryClient.refetchQueries({ queryKey: ['upcoming-classes'], exact: false })
        ]);
        
        console.log("✅ Term-related cache invalidation complete");
        resolve();
      } catch (error) {
        console.error("❌ Error invalidating term-related cache:", error);
        reject(error);
      } finally {
        isInvalidating = false;
        invalidationTimer = null;
      }
    }, 100); // Short delay to allow batching of invalidation requests
  });
}
