
import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./routes/publicRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";
import { customerRoutes } from "./routes/customerRoutes";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Branches from "./pages/Branches";

// Create a dashboard route that ONLY works for staff (admin and trainer) users
const dashboardRoute = {
  path: "/dashboard",
  element: (
    <ProtectedRoute requiredRole="trainer">
      <Dashboard />
    </ProtectedRoute>
  ),
};

// Create a branches route that ONLY works for admin users
const branchesRoute = {
  path: "/branches",
  element: (
    <ProtectedRoute requiredRole="admin">
      <Branches />
    </ProtectedRoute>
  ),
};

// Combine all routes
const router = createBrowserRouter([
  ...publicRoutes,
  ...adminRoutes.map(route => ({
    ...route,
    element: (
      <ProtectedRoute requiredRole="admin">
        {route.element}
      </ProtectedRoute>
    ),
  })),
  dashboardRoute, // Only accessible to trainers and admins (due to requiredRole="trainer")
  branchesRoute, // Only accessible to admins
  ...trainerRoutes,
  ...customerRoutes, // Customer routes with handler-specific layouts
]);

export default router;
