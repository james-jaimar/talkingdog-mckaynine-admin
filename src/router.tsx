
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import LoginPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import ClassesPage from "./pages/Classes";
import SchedulesPage from "./pages/ClassSchedules";
import HandlersPage from "./pages/Handlers";
import BranchPage from "./pages/Branches";
import UserPage from "./pages/UserAdmin";
import InvoicesPage from "./pages/Invoices";
import InvoiceDetailsPage from "./pages/InvoiceDetail";
import NotFoundPage from "./pages/NotFound";
import FinancialDashboardPage from "./pages/FinancialDashboard";
import FinancialReportsPage from "./pages/FinancialReports";
import TrainersPage from "./pages/Trainers";
import ClientsPage from "./pages/Clients";
import SignupPage from "./pages/SignupPage"; // Will use from adminRoutes
import ResetPasswordPage from "./pages/ResetPasswordPage"; // Will use from adminRoutes
import ClientDetailsPage from "./pages/ClientDetailsPage"; // Will use from adminRoutes
import UnpaidHandlersPage from "./pages/UnpaidHandlers"; // Will handle from the routes if available

// Import the route collections
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";

// Define the base routes that are available
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
    path: "/clients",
    element: <ProtectedRoute requiredRole="trainer"><ClientsPage /></ProtectedRoute>
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
