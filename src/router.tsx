
import {
  createBrowserRouter,
} from "react-router-dom";
import Auth from "./pages/Auth";
import Branches from "./pages/Branches";
import Classes from "./pages/Classes";
import ClassSchedules from "./pages/ClassSchedules";
import Handlers from "./pages/Handlers";
import UnpaidHandlers from "./pages/UnpaidHandlers";
import Trainers from "./pages/Trainers";
import UserAdmin from "./pages/UserAdmin";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import HandlerDetail from "./pages/HandlerDetail";
import ClassDetail from "./pages/ClassDetail";
import Dashboard from "./pages/Dashboard";

// Add a new import for the TrainerDashboard page
import TrainerDashboard from "./pages/TrainerDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/auth",
    element: <Auth />,
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
    path: "/classes",
    element: (
      <ProtectedRoute>
        <Classes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/classes/:classId",
    element: (
      <ProtectedRoute>
        <ClassDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class-schedules",
    element: (
      <ProtectedRoute>
        <ClassSchedules />
      </ProtectedRoute>
    ),
  },
  {
    path: "/handlers",
    element: (
      <ProtectedRoute>
        <Handlers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/handlers/:handlerId",
    element: (
      <ProtectedRoute>
        <HandlerDetail />
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
    path: "/trainers",
    element: (
      <ProtectedRoute>
        <Trainers />
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

  // Add a new route for the TrainerDashboard
  {
    path: "/trainer-dashboard",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerDashboard />
      </ProtectedRoute>
    ),
  },
]);

export default router;
