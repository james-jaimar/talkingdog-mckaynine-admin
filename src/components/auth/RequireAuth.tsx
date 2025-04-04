
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

  // Debug logging
  console.log("RequireAuth Check:", { 
    authenticated: !!user, 
    isHandler, 
    path: location.pathname,
    isLoading
  });

  // Still loading auth state - always show loading first
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
      </div>
    );
  }

  // Not authenticated - always redirect to login first
  if (!user) {
    console.log("RequireAuth: No user - redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Handler check - simplified to only redirect when on a forbidden path
  // This prevents infinite redirects when already on the correct path
  if (isHandler && !location.pathname.startsWith("/customer/")) {
    console.log("RequireAuth: Handler detected on non-customer route:", location.pathname);
    return <Navigate to="/customer/dashboard" replace />;
  }

  // User is authenticated and authorized for this route
  return <>{children}</>;
}
