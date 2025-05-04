
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from '@/context/BranchContext';
import { TermProvider } from '@/context/TermContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';

// Import pages
import FinancialReports from './pages/FinancialReports';
import FinancialDashboard from './pages/FinancialDashboard';
import PaymentDocuments from './pages/PaymentDocuments';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import ClassSchedules from './pages/ClassSchedules';
import ClassHandlers from './pages/ClassHandlers';
import Invoices from './pages/Invoices';
import InvoiceRedirect from './pages/InvoiceRedirect';
import InvoiceDetail from './pages/InvoiceDetail';

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
                <Route path="/classes/:id/schedules" element={<RequireAuth><ClassSchedules /></RequireAuth>} />
                <Route path="/class/:id/handlers" element={<RequireAuth><ClassHandlers /></RequireAuth>} />
                
                {/* Invoice routes */}
                <Route path="/invoices" element={<RequireAuth><InvoiceRedirect /></RequireAuth>} />
                <Route path="/invoices/list" element={<RequireAuth><Invoices /></RequireAuth>} />
                <Route path="/invoices/:id" element={<RequireAuth><InvoiceDetail /></RequireAuth>} />
                
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
