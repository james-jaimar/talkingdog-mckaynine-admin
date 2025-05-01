
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import LoginPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import ClassesPage from "./pages/Classes";
import SchedulesPage from "./pages/ClassSchedules";
import HandlersPage from "./pages/Handlers";
import DogsPage from "./pages/Dogs";
import BranchPage from "./pages/Branches";
import UserPage from "./pages/UserAdmin";
import InvoicesPage from "./pages/Invoices";
import InvoiceDetailsPage from "./pages/InvoiceDetail";
import NotFoundPage from "./pages/NotFound";
import DiscountPage from "./pages/admin/DiscountPage";
import SettingsPage from "./pages/admin/SettingsPage";
import MaintenancePage from "./pages/admin/maintenance/MaintenancePage";
import SignupPage from "./pages/SignupPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ClientsPage from "./pages/Clients";
import ClientDetailsPage from "./pages/ClientDetailsPage";
import TrainersPage from "./pages/Trainers";
import UnpaidHandlersPage from "./pages/UnpaidHandlers";
import FinancialDashboardPage from "./pages/FinancialDashboard";
import FinancialReportsPage from "./pages/FinancialReports"; // Import the new page

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/signup",
    element: <SignupPage />
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute requiredRole="trainer"><DashboardPage /></ProtectedRoute>,
  },
  {
    path: "/classes",
    element: <ProtectedRoute requiredRole="trainer"><ClassesPage /></ProtectedRoute>
  },
  {
    path: "/schedules",
    element: <ProtectedRoute requiredRole="trainer"><SchedulesPage /></ProtectedRoute>
  },
  {
    path: "/handlers",
    element: <ProtectedRoute requiredRole="trainer"><HandlersPage /></ProtectedRoute>
  },
  {
    path: "/dogs",
    element: <ProtectedRoute requiredRole="trainer"><DogsPage /></ProtectedRoute>
  },
  {
    path: "/clients",
    element: <ProtectedRoute requiredRole="trainer"><ClientsPage /></ProtectedRoute>
  },
  {
    path: "/clients/:clientId",
    element: <ProtectedRoute requiredRole="trainer"><ClientDetailsPage /></ProtectedRoute>
  },
  {
    path: "/invoices",
    element: <ProtectedRoute requiredRole="trainer"><InvoicesPage /></ProtectedRoute>
  },
  {
    path: "/invoices/:invoiceId",
    element: <ProtectedRoute requiredRole="trainer"><InvoiceDetailsPage /></ProtectedRoute>
  },
  {
    path: "/branches",
    element: <RequireAdmin><BranchPage /></RequireAdmin>
  },
  {
    path: "/users",
    element: <RequireAdmin><UserPage /></RequireAdmin>
  },
  {
    path: "/trainers",
    element: <RequireAdmin><TrainersPage /></RequireAdmin>
  },
  {
    path: "/discounts",
    element: <RequireAdmin><DiscountPage /></RequireAdmin>
  },
  {
    path: "/settings",
    element: <RequireAdmin><SettingsPage /></RequireAdmin>
  },
  {
    path: "/maintenance",
    element: <RequireAdmin><MaintenancePage /></RequireAdmin>
  },
  {
    path: "/unpaid-handlers",
    element: <RequireAdmin><UnpaidHandlersPage /></RequireAdmin>
  },
  {
    path: "/financial-dashboard",
    element: <RequireAdmin><FinancialDashboardPage /></RequireAdmin>
  },
  {
    path: "/financial-reports",
    element: <RequireAdmin><FinancialReportsPage /></RequireAdmin>
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);

export default router;
