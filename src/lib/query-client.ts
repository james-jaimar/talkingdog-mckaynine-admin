
import { QueryClient } from "@tanstack/react-query";

// Configure the global query client with optimized settings for financial data
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000, // Default stale time for non-financial queries
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: true,
      gcTime: 5 * 60 * 1000, // 5 minutes for garbage collection
      // Proper error handling for aborted requests
      throwOnError: (error) => {
        // Don't throw for AbortErrors (cancellation)
        if (error instanceof DOMException && error.name === 'AbortError') {
          return false;
        }
        return true;
      }
    },
    mutations: {
      retry: 1,
      networkMode: "always",
      // Proper error handling for aborted requests
      throwOnError: (error) => {
        // Don't throw for AbortErrors (cancellation)
        if (error instanceof DOMException && error.name === 'AbortError') {
          return false;
        }
        return true;
      }
    }
  }
});

// Configure specific options for financial data queries - always fresh data
queryClient.setQueryDefaults(['financial-bookings'], {
  staleTime: 0, // Always consider financial data stale (fetch on every mount)
  retry: 2,
  refetchInterval: false,
  refetchOnMount: true, // Always refetch when component mounts
  gcTime: 0, // Don't retain in cache
  refetchOnWindowFocus: true // Also refetch when window gains focus
});

// Additionally set defaults for trainer payment queries
queryClient.setQueryDefaults(['trainer-payments'], {
  staleTime: 0,
  retry: 2,
  refetchOnMount: true,
  gcTime: 0,
  refetchOnWindowFocus: true
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
