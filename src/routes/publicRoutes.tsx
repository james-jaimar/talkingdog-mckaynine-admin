
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
  
  console.log("HandlerRedirect - Auth state:", { user: !!user, isLoading, isHandler });
  
  // Always show loading while authentication is in progress
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Simple redirection logic with clear paths
  if (!user) {
    console.log("HandlerRedirect - No user, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect based on role
  if (isHandler) {
    console.log("HandlerRedirect - User is a handler, redirecting to /customer/dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  } else {
    console.log("HandlerRedirect - User is not a handler, redirecting to /dashboard");
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
