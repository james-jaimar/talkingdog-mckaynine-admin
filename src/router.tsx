
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
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerMessages from "./pages/CustomerMessages";
import Home from "./pages/Home";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Loading component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
    <span className="text-lg text-mckaynine-600">Loading...</span>
  </div>
);

// Component to handle handler redirects - always redirect handlers to customer dashboard
const HandlerRedirect = () => {
  const { isHandler } = useAuth();
  return <Navigate to={isHandler ? "/customer/dashboard" : "/dashboard"} replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <HandlerRedirect />,
    errorElement: <NotFound />,
  },
  // Single auth route for all users
  {
    path: "/auth",
    element: <Auth />,
  },
  // Admin/Staff routes - all protected with role checks
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Dashboard />
      </ProtectedRoute>
    ),
  },
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
    path: "/classes",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Classes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/handlers",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Handlers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/handler/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <HandlerDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainers",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Trainers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class-schedules",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassSchedules />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class/:id/handlers",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassHandlers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/classes/:id/schedules",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassSchedules />
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
    path: "/trainer-dashboard",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerDashboard />
      </ProtectedRoute>
    ),
  },
  
  // Forms routes for staff
  {
    path: "/forms",
    element: (
      <ProtectedRoute requiredRole="admin">
        <Forms />
      </ProtectedRoute>
    ),
  },
  {
    path: "/forms/puppy-class-registration",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <PuppyClassForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/forms/puppy-class-registration/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <PuppyClassForm />
      </ProtectedRoute>
    ),
  },
  
  // Customer-facing routes
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
  // Redirect old customer login route to unified auth page
  {
    path: "/customer/login",
    element: <Navigate to="/auth" replace />,
  },
]);

export default router;
