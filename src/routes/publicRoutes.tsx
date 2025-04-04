
import { Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

// Loading component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
    <span className="text-lg text-mckaynine-600">Loading...</span>
  </div>
);

// Completely refactored handler redirect with priority checks
export const HandlerRedirect = () => {
  const { user, isLoading, isHandler } = useAuth();
  
  // Add comprehensive logging for debugging
  console.log("Root HandlerRedirect Check:", {
    authenticated: !!user,
    isHandler,
    isLoading
  });
  
  // Show loading screen while authentication is in progress
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // CRITICAL: Handler check is now the first priority after loading
  // This ensures handlers are always redirected to customer dashboard
  if (user && isHandler) {
    console.log("Root HandlerRedirect: Handler detected - FORCING redirect to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // For authenticated non-handlers, go to dashboard
  if (user) {
    console.log("Root HandlerRedirect: Regular staff detected - going to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  // No authentication, go to auth page
  console.log("Root HandlerRedirect: No authentication - going to auth page");
  return <Navigate to="/auth" replace />;
};

export const publicRoutes = [
  {
    path: "/",
    element: <HandlerRedirect />,
    errorElement: <NotFound />,
  },
  // Single auth route for all users
  {
    path: "/auth",
    element: <Auth />,
  },
  // Redirect old customer login route to unified auth page
  {
    path: "/customer/login",
    element: <Navigate to="/auth" replace />,
  },
];
