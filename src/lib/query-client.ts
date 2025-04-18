
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      networkMode: "always",
    }
  },
});
