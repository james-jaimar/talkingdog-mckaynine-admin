
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "@/context/auth";
import { BranchProvider } from "@/context/BranchContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Handlers from "@/pages/Handlers";
import Classes from "@/pages/Classes";
import ClassSchedules from "@/pages/ClassSchedules";
import Trainers from "@/pages/Trainers";
import Branches from "@/pages/Branches";
import UserAdmin from "@/pages/UserAdmin";
import Forms from "@/pages/Forms";
import Invoices from "@/pages/Invoices";
import ClassHandlers from "@/pages/ClassHandlers";
import HandlerDetail from "@/pages/HandlerDetail";
import ClassScheduleDetail from "@/pages/ClassScheduleDetail";
import TrainerDetail from "@/pages/TrainerDetail";
import ClassDetail from "@/pages/ClassDetail";
import FormDetail from "@/pages/FormDetail";
import InvoiceDetail from "@/pages/InvoiceDetail";
import { publicRoutes } from "@/routes/publicRoutes";
import UnpaidHandlers from "@/pages/UnpaidHandlers";

// Import the CustomerInvoices component and other customer pages with correct paths
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerProfile from "@/pages/CustomerProfile";
import CustomerMessages from "@/pages/CustomerMessages";
import CustomerInvoices from "@/pages/customer/CustomerInvoices";

function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <Router>
          <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
          <Routes>
            {/* Public routes */}
            {publicRoutes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
                errorElement={route.errorElement}
              />
            ))}

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/handlers" element={<Handlers />} />
              <Route path="/handlers/:id" element={<HandlerDetail />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/classes/:id" element={<ClassDetail />} />
              <Route path="/class-schedules" element={<ClassSchedules />} />
              <Route path="/class-schedules/:id" element={<ClassScheduleDetail />} />
              <Route path="/classes/:id/handlers" element={<ClassHandlers />} />
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/trainers/:id" element={<TrainerDetail />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/user-admin" element={<UserAdmin />} />
              <Route path="/forms" element={<Forms />} />
              <Route path="/forms/:id" element={<FormDetail />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/unpaid-handlers" element={<UnpaidHandlers />} />
              
              {/* Customer routes */}
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/profile" element={<CustomerProfile />} />
              <Route path="/customer/messages" element={<CustomerMessages />} />
              <Route path="/customer/invoices" element={<CustomerInvoices />} />
            </Route>
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
