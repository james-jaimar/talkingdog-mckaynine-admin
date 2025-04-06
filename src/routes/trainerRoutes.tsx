
import { Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Handlers from "@/pages/Handlers";
import HandlerDetail from "@/pages/HandlerDetail";
import Trainers from "@/pages/Trainers";
import ClassSchedules from "@/pages/ClassSchedules";
import ClassDetail from "@/pages/ClassDetail";
import ClassHandlers from "@/pages/ClassHandlers";
import TrainerDashboard from "@/pages/TrainerDashboard";
import PuppyClassForm from "@/pages/PuppyClassForm";

export const trainerRoutes = [
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/classes",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Classes />
      </ProtectedRoute>
    ),
  },
  {
    path: "/handlers",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Handlers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/handlers/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <HandlerDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainers",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <Trainers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class-schedules",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassSchedules />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class/:id/handlers",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassHandlers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/classes/:id/schedules",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <ClassSchedules />
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
    path: "/forms/puppy-class-registration",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <PuppyClassForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/forms/puppy-class-registration/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <PuppyClassForm />
      </ProtectedRoute>
    ),
  },
];
