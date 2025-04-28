
import { QueryClient } from "@tanstack/react-query";

// Configure the global query client with optimized settings for financial data
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000, // Increased to 30 seconds for better performance
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: true,
      gcTime: 5 * 60 * 1000, // 5 minutes for garbage collection
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  }
});

// Configure specific options for financial data queries
queryClient.setQueryDefaults(['financial-bookings'], {
  staleTime: 30000, // 30 seconds specifically for financial data
  retry: 2,
  refetchInterval: false,
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Configure console logging behavior based on environment
if (process.env.NODE_ENV !== 'production') {
  // Enable more verbose logging in development
  console.log = (...args) => {
    // Filter out some of the overly verbose react-query logs
    if (args[0]?.includes?.('[react-query]') && !args[0]?.includes?.('error')) {
      return;
    }
    console.info(...args);
  };
} else {
  // Silence most logs in production
  console.log = (...args) => {
    if (args[0]?.includes?.('error:')) {
      console.error(...args);
    }
  };
}
