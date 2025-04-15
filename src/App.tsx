
// We'll use the router.tsx file instead of defining routes directly here
import { RouterProvider } from "react-router-dom";
import router from './router';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { AuthProvider } from '@/context/auth';
import { BranchProvider } from '@/context/BranchContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BranchProvider>
          <RouterProvider router={router} />
        </BranchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
