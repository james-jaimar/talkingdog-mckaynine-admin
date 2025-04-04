
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

// Simplified handler redirect with clear decision tree
export const HandlerRedirect = () => {
  const { user, isLoading, isHandler } = useAuth();
  
  // Add debugging info
  console.log("Root HandlerRedirect Check:", {
    authenticated: !!user,
    isHandler,
    isLoading
  });
  
  // Always show loading while authentication is in progress
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // No user means go to auth
  if (!user) {
    console.log("Root HandlerRedirect: No authentication - going to auth page");
    return <Navigate to="/auth" replace />;
  }
  
  // Handler users go to customer dashboard
  if (isHandler) {
    console.log("Root HandlerRedirect: Handler detected - going to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // Regular staff go to main dashboard
  console.log("Root HandlerRedirect: Regular staff detected - going to dashboard");
  return <Navigate to="/dashboard" replace />;
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
