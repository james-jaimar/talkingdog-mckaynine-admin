
import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./routes/publicRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";
import { customerRoutes } from "./routes/customerRoutes";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Create a dashboard route that ONLY works for staff (admin and trainer) users
const dashboardRoute = {
  path: "/dashboard",
  element: (
    <ProtectedRoute requiredRole="trainer">
      <Dashboard />
    </ProtectedRoute>
  ),
};

// Combine all routes
const router = createBrowserRouter([
  ...publicRoutes,
  dashboardRoute, // Only accessible to trainers and admins (due to requiredRole="trainer")
  ...adminRoutes,
  ...trainerRoutes,
  ...customerRoutes, // Customer routes with handler-specific layouts
]);

export default router;
