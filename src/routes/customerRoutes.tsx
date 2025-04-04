
import { Navigate } from "react-router-dom";
import RequireAuth from "@/components/auth/RequireAuth";
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerProfile from "@/pages/CustomerProfile";
import CustomerMessages from "@/pages/CustomerMessages";

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
    path: "/customer/forms/:formType",
    element: (
      <RequireAuth>
        <Navigate to="/customer/dashboard" replace />
      </RequireAuth>
    ),
  },
];
