
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading, isHandler } = useAuth();
  const location = useLocation();

  // Enhanced logging to track authentication flow
  console.log("RequireAuth Check:", { 
    authenticated: !!user, 
    isHandler, 
    path: location.pathname,
    isLoading
  });

  // Still loading auth state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    console.log("RequireAuth: No user - redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // CRITICAL HANDLER CHECK - Now the first check after authentication
  // This prevents handlers from accessing ANY non-customer routes
  if (isHandler) {
    // Only allow access to paths that start with /customer/
    if (!location.pathname.startsWith("/customer/")) {
      console.log("RequireAuth: HANDLER DETECTED on unauthorized route:", location.pathname);
      console.log("RequireAuth: FORCING redirect to customer dashboard");
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  // User is authenticated and authorized for this route
  return <>{children}</>;
}
