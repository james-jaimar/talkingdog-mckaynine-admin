
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

  // Add clear debug logging
  console.log("RequireAuth Check:", { 
    authenticated: !!user, 
    isHandler, 
    path: location.pathname,
    isLoading
  });

  // If still loading auth state, show loader
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!user) {
    console.log("RequireAuth: No user, redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // CRITICAL HANDLER CHECK: Force redirect handlers to customer dashboard
  // This strict rule prevents handlers from accessing any non-customer routes
  if (isHandler && !location.pathname.startsWith("/customer/")) {
    console.log("RequireAuth: HANDLER DETECTED on non-customer route:", location.pathname);
    console.log("RequireAuth: FORCE redirecting to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }

  // User is authenticated and has appropriate role for this route
  return <>{children}</>;
}
