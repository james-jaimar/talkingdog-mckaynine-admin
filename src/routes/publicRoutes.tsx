
import { Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

// Simple loading screen component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
    <span className="text-lg text-mckaynine-600">Loading...</span>
  </div>
);

// Root redirect based on authentication state
export const HandlerRedirect = () => {
  const { user, isLoading, isHandler } = useAuth();
  
  // Always show loading while authentication is in progress
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Simple redirection logic with clear paths
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect based on role
  if (isHandler) {
    return <Navigate to="/customer/dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

export const publicRoutes = [
  {
    path: "/",
    element: <HandlerRedirect />,
    errorElement: <NotFound />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  // Redirect legacy route
  {
    path: "/customer/login",
    element: <Navigate to="/auth" replace />,
  },
];
