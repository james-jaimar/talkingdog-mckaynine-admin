import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import TrainerClasses from "@/pages/trainer/TrainerClasses";
import TrainerEarnings from "@/pages/trainer/TrainerEarnings";
import TrainerClassDetail from "@/pages/trainer/TrainerClassDetail";
import TrainerNotes from "@/pages/trainer/TrainerNotes";

// Trainer-specific routes - minimal and focused on their classes only
export const trainerRoutes = [
  {
    path: "/trainer/dashboard",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainer/classes",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerClasses />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainer/class/:id",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerClassDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainer/earnings",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerEarnings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainer/notes",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerNotes />
      </ProtectedRoute>
    ),
  },
  // Legacy route redirects
  {
    path: "/trainer-dashboard",
    element: (
      <ProtectedRoute requiredRole="trainer">
        <TrainerDashboard />
      </ProtectedRoute>
    ),
  },
];
