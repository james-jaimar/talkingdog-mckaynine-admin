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
import CustomerLogin from "./pages/CustomerLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerMessages from "./pages/CustomerMessages";
import Home from "./pages/Home";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

// Loading component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
    <span className="text-lg text-mckaynine-600">Loading...</span>
  </div>
);

// Component to handle handler redirects
const HandlerRedirect = () => {
  const { isHandler } = useAuth();
  
  return isHandler ? <Navigate to="/customer/dashboard" replace /> : <Dashboard />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <NotFound />,
  },
  // Admin/Staff routes
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <HandlerRedirect />
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
  
  // Forms routes for staff
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
  
  // Customer-facing routes
  {
    path: "/customer/login",
    element: <CustomerLogin />,
  },
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
]);

export default router;
