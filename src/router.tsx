
import { createBrowserRouter } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import ClassSchedules from "./pages/ClassSchedules";
import ClassHandlers from "./pages/ClassHandlers";
import Trainers from "./pages/Trainers";
import Handlers from "./pages/Handlers";
import HandlerDetail from "./pages/HandlerDetail";
import Branches from "./pages/Branches";
import UnpaidHandlers from "./pages/UnpaidHandlers";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Use basename to handle subdirectory routing in preview environments
const basename = import.meta.env.MODE === 'production' 
  ? '/' 
  : '/';

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/classes",
    element: <ProtectedRoute><Classes /></ProtectedRoute>,
  },
  {
    path: "/class-schedules",
    element: <ProtectedRoute><ClassSchedules /></ProtectedRoute>,
  },
  {
    path: "/class-handlers/:id",
    element: <ProtectedRoute><ClassHandlers /></ProtectedRoute>,
  },
  {
    path: "/classes/:classId/handlers",
    element: <ProtectedRoute><ClassHandlers /></ProtectedRoute>,
  },
  {
    path: "/classes/:classId/schedules",
    element: <ProtectedRoute><ClassSchedules /></ProtectedRoute>,
  },
  {
    path: "/trainers",
    element: <ProtectedRoute><Trainers /></ProtectedRoute>,
  },
  {
    path: "/handlers",
    element: <ProtectedRoute><Handlers /></ProtectedRoute>,
  },
  {
    path: "/handler/:id",
    element: <ProtectedRoute><HandlerDetail /></ProtectedRoute>,
  },
  {
    path: "/branches",
    element: <ProtectedRoute><Branches /></ProtectedRoute>,
  },
  {
    path: "/unpaid-handlers",
    element: <ProtectedRoute><UnpaidHandlers /></ProtectedRoute>,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    // Explicit 404 route
    path: "/404",
    element: <NotFound />,
  },
  {
    // Catch all route for any undefined paths
    path: "*",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>, 
  },
], {
  basename,
});

export default router;
