
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from '@/context/BranchContext';
import { TermProvider } from '@/context/TermContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import top-level pages that we know exist based on router.tsx
import FinancialReports from './pages/FinancialReports';
import FinancialDashboard from './pages/FinancialDashboard';
import PaymentDocuments from './pages/PaymentDocuments';

// Create a new query client with sane defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BranchProvider>
          <TermProvider>
            <Router>
              <Routes>
                {/* For now, we'll just include the financial reports routes */}
                <Route path="/" element={<RequireAuth><FinancialDashboard /></RequireAuth>} />
                <Route path="/financial-dashboard" element={<RequireAuth><FinancialDashboard /></RequireAuth>} />
                <Route path="/financial-reports" element={<RequireAuth><FinancialReports /></RequireAuth>} />
                <Route path="/payment-documents" element={<RequireAuth><PaymentDocuments /></RequireAuth>} />
              </Routes>
            </Router>
            <Toaster />
          </TermProvider>
        </BranchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
