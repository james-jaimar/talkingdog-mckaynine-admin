
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/RequireAuth";
import UserManagement from "./pages/UserManagement";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
      <RequireAuth>
        <UserManagement />
      </RequireAuth>
    ),
  },
]);

export default router;
