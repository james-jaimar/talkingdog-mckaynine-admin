
import { Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

// Loading component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
    <span className="text-lg text-mckaynine-600">Loading...</span>
  </div>
);

// Component to handle handler redirects - always redirect handlers to customer dashboard
export const HandlerRedirect = () => {
  const { user, isLoading, isHandler } = useAuth();
  
  // If loading, show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // If user is a handler, always redirect to customer dashboard
  if (user && isHandler) {
    console.log("HandlerRedirect: Redirecting handler to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // If user is staff (admin or trainer), redirect to staff dashboard
  if (user) {
    console.log("HandlerRedirect: Redirecting staff to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not logged in, redirect to auth page
  console.log("HandlerRedirect: No user, redirecting to auth");
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
