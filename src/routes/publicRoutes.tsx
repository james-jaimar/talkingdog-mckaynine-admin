
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

// Simple, direct handler redirect with clear logging
export const HandlerRedirect = () => {
  const { user, isLoading, isHandler } = useAuth();
  
  // Show loading screen while authentication is in progress
  if (isLoading) {
    console.log("Root HandlerRedirect: Still loading auth state");
    return <LoadingScreen />;
  }
  
  // CRITICAL: Always check handler status first and force redirect
  if (user && isHandler) {
    console.log("Root HandlerRedirect: Handler detected, FORCE redirecting to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // For regular staff, go to dashboard
  if (user) {
    console.log("Root HandlerRedirect: Regular staff, going to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  // No authentication, go to login
  console.log("Root HandlerRedirect: No authentication, going to auth page");
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
