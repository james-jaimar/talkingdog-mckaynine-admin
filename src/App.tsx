
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './router';
import { Toaster } from '@/components/ui/toaster';
import './App.css';
import { BranchProvider } from './context/BranchContext';
import { AuthProvider } from './context/AuthContext';

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
      <AuthProvider>
        <BranchProvider>
          <RouterProvider router={router} />
          <Toaster />
        </BranchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
