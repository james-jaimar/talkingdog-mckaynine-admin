
import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./routes/publicRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";
import { customerRoutes } from "./routes/customerRoutes";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Create a root dashboard route that works for all authenticated users
const dashboardRoute = {
  path: "/dashboard",
  element: (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
};

// Combine all routes
const router = createBrowserRouter([
  ...publicRoutes,
  dashboardRoute, // Add the dashboard route without role restriction
  ...adminRoutes,
  ...trainerRoutes,
  ...customerRoutes,
]);

export default router;
