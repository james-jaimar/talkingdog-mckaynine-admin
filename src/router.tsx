
import { createBrowserRouter, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";
import UserAdmin from "./pages/UserAdmin";
import UserManagement from "./pages/UserManagement";
import Classes from "./pages/Classes";
import Handlers from "./pages/Handlers";
import Trainers from "./pages/Trainers";
import ClassSchedules from "./pages/ClassSchedules";
import Branches from "./pages/Branches";
import UnpaidHandlers from "./pages/UnpaidHandlers";
import TrainerDashboard from "./pages/TrainerDashboard";
import HandlerDetail from "./pages/HandlerDetail";
import ClassDetail from "./pages/ClassDetail";
import ClassHandlers from "./pages/ClassHandlers";
import { useAuth } from "./context/auth";

// Home component with redirect logic
const Home = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to McKaynine Training Centre</h1>
      <p className="text-lg">Please sign in to access your dashboard.</p>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
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
  {
    path: "/classes",
    element: (
      <RequireAuth>
        <Classes />
      </RequireAuth>
    ),
  },
  {
    path: "/handlers",
    element: (
      <RequireAuth>
        <Handlers />
      </RequireAuth>
    ),
  },
  {
    path: "/handler/:id",
    element: (
      <RequireAuth>
        <HandlerDetail />
      </RequireAuth>
    ),
  },
  {
    path: "/trainers",
    element: (
      <RequireAuth>
        <Trainers />
      </RequireAuth>
    ),
  },
  {
    path: "/class-schedules",
    element: (
      <RequireAuth>
        <ClassSchedules />
      </RequireAuth>
    ),
  },
  {
    path: "/class/:id",
    element: (
      <RequireAuth>
        <ClassDetail />
      </RequireAuth>
    ),
  },
  {
    path: "/class/:id/handlers",
    element: (
      <RequireAuth>
        <ClassHandlers />
      </RequireAuth>
    ),
  },
  {
    path: "/branches",
    element: (
      <RequireAdmin>
        <Branches />
      </RequireAdmin>
    ),
  },
  {
    path: "/unpaid-handlers",
    element: (
      <RequireAdmin>
        <UnpaidHandlers />
      </RequireAdmin>
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
]);

export default router;
