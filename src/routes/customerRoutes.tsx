
import { Navigate } from "react-router-dom";
import RequireAuth from "@/components/auth/RequireAuth";
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerProfile from "@/pages/CustomerProfile";
import CustomerMessages from "@/pages/CustomerMessages";
import CustomerInvoices from "@/pages/CustomerInvoices";
import CustomerInvoiceDetail from "@/pages/CustomerInvoiceDetail";
import CustomerPuppyClassForm from "@/pages/CustomerPuppyClassForm";

export const customerRoutes = [
  {
    path: "/customer/dashboard",
    element: (
      <RequireAuth>
        <CustomerDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/profile",
    element: (
      <RequireAuth>
        <CustomerProfile />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/messages",
    element: (
      <RequireAuth>
        <CustomerMessages />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/invoices",
    element: (
      <RequireAuth>
        <CustomerInvoices />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/invoices/:id",
    element: (
      <RequireAuth>
        <CustomerInvoiceDetail />
      </RequireAuth>
    ),
  },
  // Redirect customer URLs that haven't been implemented yet
  {
    path: "/customer/classes",
    element: (
      <RequireAuth>
        <Navigate to="/customer/dashboard" replace />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/forms",
    element: (
      <RequireAuth>
        <Navigate to="/customer/dashboard" replace />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/forms/puppy-class",
    element: (
      <RequireAuth>
        <CustomerPuppyClassForm />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/forms/:formType",
    element: (
      <RequireAuth>
        <Navigate to="/customer/dashboard" replace />
      </RequireAuth>
    ),
  },
];
