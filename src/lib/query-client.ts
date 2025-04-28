
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 30, // Reduced from 2 minutes to 30 seconds
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
      gcTime: 1000 * 60 * 5, // 5 minutes for garbage collection
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  },
});
