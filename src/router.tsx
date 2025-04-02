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
import Forms from "./pages/Forms";
import PuppyClassForm from "./pages/PuppyClassForm";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

// Home component with redirect logic
const Home = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/auth" replace />;
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
    path: "/classes/:id/schedules",
    element: (
      <RequireAuth>
        <ClassSchedules />
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
  
  // Forms routes
  {
    path: "/forms",
    element: (
      <RequireAdmin>
        <Forms />
      </RequireAdmin>
    ),
  },
  {
    path: "/forms/puppy-class-registration",
    element: (
      <RequireAuth>
        <PuppyClassForm />
      </RequireAuth>
    ),
  },
  {
    path: "/forms/puppy-class-registration/:id",
    element: (
      <RequireAuth>
        <PuppyClassForm />
      </RequireAuth>
    ),
  },
]);

export default router;
