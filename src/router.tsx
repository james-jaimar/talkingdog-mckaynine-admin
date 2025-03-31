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
import Index from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <NotFound />,
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
]);

export default router;
