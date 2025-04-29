
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
      
      // Handle cancelled requests properly
      throwOnError: (error) => {
        if (isCancelledError(error)) {
          console.log('Query was cancelled, suppressing error');
          return false;
        }
        return true;
      }
    },
    mutations: {
      retry: 1,
      networkMode: "always",
      
      // Handle cancelled requests properly
      throwOnError: (error) => {
        if (isCancelledError(error)) {
          console.log('Mutation was cancelled, suppressing error');
          return false;
        }
        return true;
      }
    }
  }
});

// Helper to check for cancelled/aborted errors
function isCancelledError(error: unknown): boolean {
  // Type guard checking if error is an object with name or message properties
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  const errorObj = error as { 
    name?: string; 
    message?: string; 
    [key: string]: unknown 
  };
  
  return (
    (errorObj instanceof DOMException && errorObj.name === 'AbortError') ||
    errorObj.name === 'CancelledError' ||
    !!errorObj.message?.includes?.('cancelled') ||
    !!errorObj.message?.includes?.('aborted')
  );
}

// Set default options for financial queries - always fresh data
queryClient.setQueryDefaults(['financial-bookings'], {
  staleTime: 0, // Always consider financial data stale
  retry: 1,
  refetchInterval: false,
  refetchOnMount: true, // Always refetch when component mounts
  gcTime: 0, // Don't retain in cache
  refetchOnWindowFocus: true // Also refetch when window gains focus
});

// Set defaults for trainer payment queries
queryClient.setQueryDefaults(['trainer-payments'], {
  staleTime: 0,
  retry: 1,
  refetchOnMount: true,
  gcTime: 0,
  refetchOnWindowFocus: true
});

// Configure console logging behavior based on environment
if (process.env.NODE_ENV !== 'production') {
  // Enable more verbose logging in development
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Filter out some of the overly verbose react-query logs
    if (args[0]?.includes?.('[react-query]') && !args[0]?.includes?.('error')) {
      return;
    }
    originalConsoleLog(...args);
  };
} else {
  // Silence most logs in production
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  console.log = (...args) => {
    if (args[0]?.includes?.('error:')) {
      originalConsoleError(...args);
    }
  };
}
