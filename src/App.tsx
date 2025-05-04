
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from '@/context/BranchContext';
import { TermProvider } from '@/context/TermContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './router';

// Import pages
import FinancialReports from './pages/FinancialReports';
import FinancialDashboard from './pages/FinancialDashboard';
import PaymentDocuments from './pages/PaymentDocuments';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';

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
                <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/financial-dashboard" element={<RequireAuth><FinancialDashboard /></RequireAuth>} />
                <Route path="/financial-reports" element={<RequireAuth><FinancialReports /></RequireAuth>} />
                <Route path="/payment-documents" element={<RequireAuth><PaymentDocuments /></RequireAuth>} />
                <Route path="/classes" element={<RequireAuth><Classes /></RequireAuth>} />
                {/* Add a 404 route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
