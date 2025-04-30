
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnReconnect: true,
      gcTime: 1000 * 60 * 10, // 10 minutes - how long to keep inactive data in cache
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  },
});

// Add a listener to ensure we don't return stale data even if network requests fail
queryClient.setDefaultOptions({
  queries: {
    // React Query v5 no longer supports onSettled at this level
    // Use meta for error handling or a global error handler
    structuralSharing: false // This forces new references even for identical data
  }
});

// Add a global query error handler
queryClient.getQueryCache().subscribe(event => {
  if (event.type === 'error' && event.error) {
    console.error("Query error:", event.error);
  }
});
