
import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./routes/publicRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";
import { customerRoutes } from "./routes/customerRoutes";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Branches from "./pages/Branches";
import UnpaidHandlers from "./pages/UnpaidHandlers";
import NotFound from "./pages/NotFound";
import UserAdmin from "./pages/UserAdmin";
import Handlers from "./pages/Handlers";
import HandlerDetail from "./pages/HandlerDetail";

// Create a dashboard route that ONLY works for staff (admin and trainer) users
const dashboardRoute = {
  path: "/dashboard",
  element: (
    <ProtectedRoute requiredRole="trainer">
      <Dashboard />
    </ProtectedRoute>
  ),
};

// Create handlers routes that work for trainers and admin users
const handlersRoute = {
  path: "/handlers",
  element: (
    <ProtectedRoute requiredRole="trainer">
      <Handlers />
    </ProtectedRoute>
  ),
};

const handlerDetailRoute = {
  path: "/handlers/:id",
  element: (
    <ProtectedRoute requiredRole="trainer">
      <HandlerDetail />
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

// Create an unpaid-handlers route that ONLY works for admin users
const unpaidHandlersRoute = {
  path: "/unpaid-handlers",
  element: (
    <ProtectedRoute requiredRole="admin">
      <UnpaidHandlers />
    </ProtectedRoute>
  ),
};

// Create a user-admin route that ONLY works for admin users
const userAdminRoute = {
  path: "/user-admin",
  element: (
    <ProtectedRoute requiredRole="admin">
      <UserAdmin />
    </ProtectedRoute>
  ),
};

// Create a 404 route for missing pages
const notFoundRoute = {
  path: "*", // Catch all unmatched routes
  element: <NotFound />,
};

// Create a dedicated 404 route page
const notFound404Route = {
  path: "/404",
  element: <NotFound />,
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
  dashboardRoute, // Only accessible to trainers and admins
  handlersRoute, // Only accessible to trainers and admins
  handlerDetailRoute, // Only accessible to trainers and admins
  branchesRoute, // Only accessible to admins
  unpaidHandlersRoute, // Only accessible to admins
  userAdminRoute, // Only accessible to admins
  ...trainerRoutes,
  ...customerRoutes, // Customer routes with handler-specific layouts
  notFound404Route, // Explicit 404 route
  notFoundRoute, // Must be last to catch all other routes
]);

export default router;
