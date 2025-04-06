
import { Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import UserAdmin from "@/pages/UserAdmin";
import UserManagement from "@/pages/UserManagement";
import Branches from "@/pages/Branches";
import UnpaidHandlers from "@/pages/UnpaidHandlers";
import Forms from "@/pages/Forms";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceEdit from "@/pages/InvoiceEdit";

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
    path: "/user-management",
    element: (
      <ProtectedRoute requiredRole="admin">
        <UserManagement />
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
