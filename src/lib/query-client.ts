
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
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  }
});

// Configure console logging behavior based on environment
if (process.env.NODE_ENV !== 'production') {
  // Enable more verbose logging in development
  queryClient.setDefaultOptions({
    queries: {
      retry: 1,
    },
  });
} else {
  // Silence most logs in production
  console.log = (...args) => {
    if (args[0]?.includes?.('error:')) {
      console.error(...args);
    }
  };
}
