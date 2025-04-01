import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import TrainerDashboard from "./pages/TrainerDashboard";
import HandlerDashboard from "./pages/HandlerDashboard";
import TrainingSession from "./pages/TrainingSession";
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
    path: "/trainer-dashboard",
    element: (
      <RequireAuth>
        <TrainerDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/handler-dashboard",
    element: (
      <RequireAuth>
        <HandlerDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/training-session/:id",
    element: (
      <RequireAuth>
        <TrainingSession />
      </RequireAuth>
    ),
  },
  {
    path: "/user-admin",
    element: <UserManagement />,
  },
]);

export default router;
