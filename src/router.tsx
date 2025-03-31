
import { createBrowserRouter, Navigate } from "react-router-dom";

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
import Index from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/classes",
    element: <Classes />,
  },
  {
    path: "/class-schedules",
    element: <ClassSchedules />,
  },
  {
    path: "/class-handlers/:id",
    element: <ClassHandlers />,
  },
  {
    path: "/classes/:classId/handlers",
    element: <ClassHandlers />,
  },
  {
    path: "/trainers",
    element: <Trainers />,
  },
  {
    path: "/handlers",
    element: <Handlers />,
  },
  {
    path: "/handler/:id",
    element: <HandlerDetail />,
  },
  {
    path: "/branches",
    element: <Branches />,
  },
  {
    path: "/unpaid-handlers",
    element: <UnpaidHandlers />,
  },
  {
    // Explicit 404 route
    path: "/404",
    element: <NotFound />,
  },
  {
    // Catch all route for any undefined paths
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
