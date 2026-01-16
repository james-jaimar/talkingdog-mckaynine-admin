
import { Navigate } from "react-router-dom";
import RequireAuth from "@/components/auth/RequireAuth";
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerProfile from "@/pages/CustomerProfile";
import CustomerMessages from "@/pages/CustomerMessages";
import CustomerInvoices from "@/pages/CustomerInvoices";
import CustomerInvoiceDetail from "@/pages/CustomerInvoiceDetail";
import CustomerPuppyClassForm from "@/pages/CustomerPuppyClassForm";
import CustomerClassEnrollment from "@/pages/customer/CustomerClassEnrollment";
import CustomerClasses from "@/pages/customer/CustomerClasses";

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
  // Self-service enrollment from email invitation
  {
    path: "/customer/enroll/:token",
    element: (
      <RequireAuth>
        <CustomerClassEnrollment />
      </RequireAuth>
    ),
  },
  // My Classes page
  {
    path: "/customer/classes",
    element: (
      <RequireAuth>
        <CustomerClasses />
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
