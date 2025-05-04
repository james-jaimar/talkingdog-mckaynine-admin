
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { BranchProvider } from '@/context/BranchContext';
import { TermProvider } from '@/context/TermContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MailProvider } from '@/context/EmailContext';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import DogDetails from './pages/DogDetails';
import ClientDetails from './pages/ClientDetails';
import UserAdmin from './pages/UserAdmin';
import ClientPage from './pages/ClientPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import TrainersPage from './pages/TrainersPage';
import TrainerDetails from './pages/TrainerDetails';
import Handlers from './pages/Handlers';
import HandlerDetails from './pages/HandlerDetails';
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import FinancialDashboard from './pages/FinancialDashboard';
import FinancialReports from './pages/FinancialReports';
import PaymentDocuments from './pages/PaymentDocuments';
import AdminPanel from './pages/AdminPanel';
import Schedules from './pages/Schedules';
import NewClass from './pages/NewClass';
import NewInvoice from './pages/NewInvoice';
import NewDog from './pages/NewDog';
import ForgotPassword from './pages/ForgotPassword';
import MyAccount from './pages/MyAccount';
import BranchManagement from './pages/BranchManagement';
import ClassNotes from './pages/ClassNotes';
import ClientNotes from './pages/ClientNotes';
import UnpaidHandlers from './pages/UnpaidHandlers';
import DogNotes from './pages/DogNotes';

// Create a new query client
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
      <ThemeProvider>
        <AuthProvider>
          <BranchProvider>
            <TermProvider>
              <MailProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Protected routes */}
                    <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                    <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                    <Route path="/classes" element={<RequireAuth><Classes /></RequireAuth>} />
                    <Route path="/classes/:id" element={<RequireAuth><ClassDetailsPage /></RequireAuth>} />
                    <Route path="/create-class" element={<RequireAuth><NewClass /></RequireAuth>} />
                    <Route path="/class-notes/:id" element={<RequireAuth><ClassNotes /></RequireAuth>} />
                    
                    <Route path="/trainers" element={<RequireAuth><TrainersPage /></RequireAuth>} />
                    <Route path="/trainers/:id" element={<RequireAuth><TrainerDetails /></RequireAuth>} />
                    
                    <Route path="/handlers" element={<RequireAuth><Handlers /></RequireAuth>} />
                    <Route path="/handlers/:id" element={<RequireAuth><HandlerDetails /></RequireAuth>} />
                    <Route path="/unpaid-handlers" element={<RequireAuth><UnpaidHandlers /></RequireAuth>} />
                    
                    <Route path="/client/:id" element={<RequireAuth><ClientPage /></RequireAuth>} />
                    <Route path="/client-details/:id" element={<RequireAuth><ClientDetails /></RequireAuth>} />
                    <Route path="/client-notes/:id" element={<RequireAuth><ClientNotes /></RequireAuth>} />
                    
                    <Route path="/dog/:id" element={<RequireAuth><DogDetails /></RequireAuth>} />
                    <Route path="/create-dog" element={<RequireAuth><NewDog /></RequireAuth>} />
                    <Route path="/dog-notes/:id" element={<RequireAuth><DogNotes /></RequireAuth>} />
                    
                    <Route path="/user-admin" element={<RequireAuth><UserAdmin /></RequireAuth>} />
                    <Route path="/admin-panel" element={<RequireAuth><AdminPanel /></RequireAuth>} />
                    
                    <Route path="/invoices" element={<RequireAuth><Invoices /></RequireAuth>} />
                    <Route path="/invoices/:id" element={<RequireAuth><InvoiceDetails /></RequireAuth>} />
                    <Route path="/create-invoice" element={<RequireAuth><NewInvoice /></RequireAuth>} />
                    
                    <Route path="/financial-dashboard" element={<RequireAuth><FinancialDashboard /></RequireAuth>} />
                    <Route path="/financial-reports" element={<RequireAuth><FinancialReports /></RequireAuth>} />
                    <Route path="/payment-documents" element={<RequireAuth><PaymentDocuments /></RequireAuth>} />
                    
                    <Route path="/schedules" element={<RequireAuth><Schedules /></RequireAuth>} />
                    <Route path="/my-account" element={<RequireAuth><MyAccount /></RequireAuth>} />
                    <Route path="/branch-management" element={<RequireAuth><BranchManagement /></RequireAuth>} />
                  </Routes>
                </Router>
                <Toaster />
              </MailProvider>
            </TermProvider>
          </BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
