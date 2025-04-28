
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Enable refetch on window focus for fresh data
      staleTime: 1000 * 60 * 2, // 2 minutes - reduced stale time to ensure more frequent refreshes
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  },
});
