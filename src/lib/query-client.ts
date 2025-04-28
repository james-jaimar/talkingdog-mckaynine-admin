
import { QueryClient } from "@tanstack/react-query";

// Configure the global query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Reduce automatic refetches
      staleTime: 1000 * 60, // Increased to 1 minute to reduce fetching
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: true, // Changed from 'always' to reduce refetches
      gcTime: 1000 * 60 * 5, // 5 minutes for garbage collection
      // Silence debug logs in production
      logging: process.env.NODE_ENV === 'development',
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  },
  // Configure logger to only log in development
  logger: {
    log: process.env.NODE_ENV === 'development' ? console.log : () => {},
    warn: console.warn,
    error: console.error,
  }
});
