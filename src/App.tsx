import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Loading } from "@/components/Loading";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Lazy load pages
const LoginPage = lazy(() => import("@/pages/Login"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPassword"));
const UpdatePasswordPage = lazy(() => import("@/pages/UpdatePassword"));
const ClassSchedulesPage = lazy(() => import("@/pages/ClassSchedules"));
const HandlerSchedulePage = lazy(() => import("@/pages/HandlerSchedule"));
const HandlersPage = lazy(() => import("@/pages/Handlers"));
const ClassesPage = lazy(() => import("@/pages/Classes"));
const ClassHandlersPage = lazy(() => import("@/pages/ClassHandlers"));
const RegisterHandlerPage = lazy(() => import("@/pages/RegisterHandler"));
const HomeLayoutPage = lazy(() => import("@/pages/HomeLayout"));
const BranchesPage = lazy(() => import("@/pages/Branches"));
const TrainersPage = lazy(() => import("@/pages/Trainers"));
const InvoicesPage = lazy(() => import("@/pages/Invoices"));
const InvoiceDetailPage = lazy(() => import("@/pages/InvoiceDetail"));
const CreateInvoicePage = lazy(() => import("@/pages/CreateInvoice"));
const FormsPage = lazy(() => import("@/pages/Forms"));
const UserAdminPage = lazy(() => import("@/pages/UserAdmin"));
const CalendarPage = lazy(() => import("@/pages/Calendar"));
const BranchManagement = lazy(() => import("@/pages/BranchManagement"));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/" element={<ProtectedRoute element={<DashboardPage />} />} />
          <Route path="/class-schedules" element={<ProtectedRoute element={<ClassSchedulesPage />} />} />
          <Route path="/class/:classId/handlers" element={<ProtectedRoute element={<ClassHandlersPage />} />} />
          <Route path="/classes/:id/schedules" element={<ProtectedRoute element={<ClassSchedulesPage />} />} />
          <Route path="/class/:classId/schedules" element={<ProtectedRoute element={<ClassSchedulesPage />} />} />
          <Route path="/handlers" element={<ProtectedRoute element={<HandlersPage />} />} />
          <Route path="/classes" element={<ProtectedRoute element={<ClassesPage />} />} />
          <Route path="/register-handler" element={<ProtectedRoute element={<RegisterHandlerPage />} />} />
          <Route path="/home-layout" element={<ProtectedRoute element={<HomeLayoutPage />} />} />
          <Route path="/branches" element={<ProtectedRoute element={<BranchesPage />} requiredRole="admin" />} />
          <Route path="/trainers" element={<ProtectedRoute element={<TrainersPage />} requiredRole="admin" />} />
          <Route path="/invoices" element={<ProtectedRoute element={<InvoicesPage />} />} />
          <Route path="/invoices/:id" element={<ProtectedRoute element={<InvoiceDetailPage />} />} />
          <Route path="/create-invoice" element={<ProtectedRoute element={<CreateInvoicePage />} />} />
          <Route path="/forms" element={<ProtectedRoute element={<FormsPage />} requiredRole="admin" />} />
          <Route path="/user-admin" element={<ProtectedRoute element={<UserAdminPage />} requiredRole="admin" />} />
          <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
          <Route path="/branch-management" element={<ProtectedRoute element={<BranchManagement />} requiredRole="admin" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
