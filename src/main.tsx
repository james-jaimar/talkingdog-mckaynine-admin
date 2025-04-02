
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { AuthProvider } from '@/context/auth';
import { BranchProvider } from '@/context/BranchContext';
import './index.css';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Ensure there's a DOM element with id "root"
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
  const rootDiv = document.createElement("div");
  rootDiv.id = "root";
  document.body.appendChild(rootDiv);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BranchProvider>
          <RouterProvider router={router} />
        </BranchProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
