
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Dashboard from './pages/Dashboard';
import { InvoicesProvider } from './context/InvoicesDataContext';
import { Toaster } from 'sonner';
import { BranchProvider } from './context/BranchContext';

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
      <BrowserRouter>
        <BranchProvider>
          <Toaster />
          <InvoicesProvider>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
            </Routes>
          </InvoicesProvider>
        </BranchProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
