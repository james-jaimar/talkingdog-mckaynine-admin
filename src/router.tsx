
import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./routes/publicRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";
import { customerRoutes } from "./routes/customerRoutes";
import { assistantAdminRoutes } from "./routes/assistantRoutes";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Branches from "./pages/Branches";
import UnpaidHandlers from "./pages/UnpaidHandlers";
import NotFound from "./pages/NotFound";
import UserAdmin from "./pages/UserAdmin";
import TemplateDesigner from "./pages/platform-admin/TemplateDesigner";
import Trainers from "./pages/Trainers";
import AssistantLogin from "./pages/AssistantLogin";
import AssistantSchedulePage from "./pages/assistant/AssistantSchedule";

// Create a dashboard route that ONLY works for admin users (trainers have their own dashboard)
const dashboardRoute = {
  path: "/dashboard",
  element: (
    <ProtectedRoute requiredRole="admin">
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

// Create a template designer route that ONLY works for platform admins
const templateDesignerRoute = {
  path: "/platform-admin/templates",
  element: (
    <ProtectedRoute requiredRole="platform_admin">
      <TemplateDesigner />
    </ProtectedRoute>
  ),
};

// Create a trainers route that ONLY works for admin users
const trainersRoute = {
  path: "/trainers",
  element: (
    <ProtectedRoute requiredRole="admin">
      <Trainers />
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

// Combine all routes - assistants routes are now consolidated
const router = createBrowserRouter([
  ...publicRoutes,
  { path: "/assistant-login", element: <AssistantLogin /> },
  { path: "/assistant/schedule", element: <AssistantSchedulePage /> },
  ...adminRoutes.map(route => ({
    ...route,
    element: (
      <ProtectedRoute requiredRole="admin">
        {route.element}
      </ProtectedRoute>
    ),
  })),
  dashboardRoute,
  branchesRoute,
  unpaidHandlersRoute,
  userAdminRoute,
  templateDesignerRoute,
  trainersRoute,
  ...trainerRoutes,
  ...customerRoutes,
  notFound404Route,
  notFoundRoute,
]);

export default router;
