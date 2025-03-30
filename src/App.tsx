
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './router';
import { Toaster } from '@/components/ui/sonner';
import './App.css';
import { BranchProvider } from './context/BranchContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <RouterProvider router={router} />
        <Toaster richColors closeButton position="top-right" />
      </BranchProvider>
    </QueryClientProvider>
  );
}

export default App;
