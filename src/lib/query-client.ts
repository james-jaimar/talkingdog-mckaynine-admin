
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch fresh data
      retry: 1,
      refetchOnReconnect: true,
      gcTime: 1000 * 60 * 10, // 10 minutes - how long to keep inactive data in cache
      structuralSharing: false, // Always force new references
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  },
});

// Add a global query error handler
queryClient.getQueryCache().subscribe(event => {
  if (event.type === 'updated' && event.query.state.error) {
    console.error("Query error:", event.query.state.error);
  }
});

// Global function to invalidate all term-related data
export async function invalidateTermRelatedData() {
  console.log("Invalidating all term-related data");
  
  // First, forcefully remove all relevant cache entries
  await Promise.all([
    queryClient.removeQueries({ queryKey: ['classes'], exact: false }),
    queryClient.removeQueries({ queryKey: ['class-schedules'], exact: false }),
    queryClient.removeQueries({ queryKey: ['dashboard-stats'], exact: false })
  ]);
  
  // Then invalidate to trigger refetches
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['classes'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['class-schedules'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['recent-bookings'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['upcoming-classes'], exact: false })
  ]);
  
  console.log("Term-related data invalidation complete");
  
  // Force immediate refetch of key queries
  return Promise.all([
    queryClient.refetchQueries({ queryKey: ['classes'], exact: false }),
    queryClient.refetchQueries({ queryKey: ['class-handlers'], exact: false })
  ]);
}
