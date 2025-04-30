
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 0, // Reduce stale time to get fresher data
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
export function invalidateTermRelatedData() {
  console.log("Invalidating all term-related data");
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['classes'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['class-schedules'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['recent-bookings'], exact: false }),
    queryClient.invalidateQueries({ queryKey: ['upcoming-classes'], exact: false })
  ]);
}
