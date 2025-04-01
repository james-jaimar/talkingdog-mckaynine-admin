
import { createBrowserRouter } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";
import UserAdmin from "./pages/UserAdmin";
import UserManagement from "./pages/UserManagement";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to McKaynine Training Centre</h1>
        <p className="text-lg">Please sign in to access your dashboard.</p>
      </div>
    ),
    errorElement: <NotFound />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/user-admin",
    element: (
      <RequireAdmin>
        <UserAdmin />
      </RequireAdmin>
    ),
  },
  {
    path: "/user-management",
    element: (
      <RequireAdmin>
        <UserManagement />
      </RequireAdmin>
    ),
  },
]);

export default router;
