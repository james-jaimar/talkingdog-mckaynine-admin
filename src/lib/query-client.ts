
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

// Global function to invalidate all term-related data
export async function invalidateTermRelatedData() {
  try {
    // First, remove cached data to ensure fresh fetch
    await Promise.all([
      queryClient.removeQueries({ queryKey: ['classes'], exact: false }),
      queryClient.removeQueries({ queryKey: ['class-schedules'], exact: false }),
      queryClient.removeQueries({ queryKey: ['dashboard-stats'], exact: false })
    ]);
    
    // Then trigger refetches
    return Promise.all([
      queryClient.refetchQueries({ queryKey: ['classes'], exact: false }),
      queryClient.refetchQueries({ queryKey: ['dashboard-stats'], exact: false })
    ]);
  } catch (error) {
    return Promise.reject(error);
  }
}
