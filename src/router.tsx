
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
import NotFound from "./pages/NotFound";
import TrainerDashboard from "./pages/TrainerDashboard";
import TrainerReferences from "./pages/TrainerReferences";
import ClassHandlers from "./pages/ClassHandlers";

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
    path: "/classes/:classId/schedules",
    element: (
      <ProtectedRoute>
        <ClassSchedules />
      </ProtectedRoute>
    ),
  },
  {
    path: "/classes/:classId/handlers",
    element: (
      <ProtectedRoute>
        <ClassHandlers />
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
    path: "/trainer-references",
    element: (
      <ProtectedRoute requiredRole="admin">
        <TrainerReferences />
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
    path: "/trainer-dashboard",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
