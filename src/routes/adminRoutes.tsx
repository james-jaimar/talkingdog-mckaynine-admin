
import { Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import UserAdmin from "@/pages/UserAdmin";
import Branches from "@/pages/Branches";
import UnpaidHandlers from "@/pages/UnpaidHandlers";
import Forms from "@/pages/Forms";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceEdit from "@/pages/InvoiceEdit";
import BranchManagement from "@/pages/BranchManagement";
import FinancialDashboard from "@/pages/FinancialDashboard";

export const adminRoutes = [
  {
    path: "/user-admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <UserAdmin />
      </ProtectedRoute>
    ),
  },
  {
    path: "/branches",
    element: (
      <ProtectedRoute requiredRole="admin">
        <Branches />
      </ProtectedRoute>
    ),
  },
  {
    path: "/branch-management",
    element: (
      <ProtectedRoute requiredRole="admin">
        <BranchManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/unpaid-handlers",
    element: (
      <ProtectedRoute requiredRole="admin">
        <UnpaidHandlers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/forms",
    element: (
      <ProtectedRoute requiredRole="admin">
        <Forms />
      </ProtectedRoute>
    ),
  },
  // Financial dashboard route
  {
    path: "/financial-dashboard",
    element: (
      <ProtectedRoute requiredRole="admin">
        <FinancialDashboard />
      </ProtectedRoute>
    ),
  },
  // Invoice routes
  {
    path: "/invoices",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Invoices />
      </ProtectedRoute>
    ),
  },
  {
    path: "/invoices/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <InvoiceDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/invoices/:id/edit",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <InvoiceEdit />
      </ProtectedRoute>
    ),
  },
];
