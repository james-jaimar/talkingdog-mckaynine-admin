
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './router';
import { Toaster } from 'sonner';
import { BranchProvider } from './context/BranchContext';
import { AuthProvider } from './context/auth/AuthProvider';
import { TermProvider } from './context/TermContext';
import { InvoicesProvider } from './context/InvoicesDataContext';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TermProvider>
          <BranchProvider>
            <Toaster />
            <InvoicesProvider>
              <RouterProvider router={router} />
            </InvoicesProvider>
          </BranchProvider>
        </TermProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
