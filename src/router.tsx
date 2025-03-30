
import { createBrowserRouter } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Handlers from "./pages/Handlers";
import HandlerDetail from "./pages/HandlerDetail";
import Trainers from "./pages/Trainers";
import Classes from "./pages/Classes";
import ClassSchedules from "./pages/ClassSchedules";
import Branches from "./pages/Branches";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/handlers",
    element: <Handlers />,
  },
  {
    path: "/handlers/:id",
    element: <HandlerDetail />,
  },
  {
    path: "/trainers",
    element: <Trainers />,
  },
  {
    path: "/classes",
    element: <Classes />,
  },
  {
    path: "/classes/:id/schedules",
    element: <ClassSchedules />,
  },
  {
    path: "/branches",
    element: <Branches />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
