
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

  // If still loading auth state, show an improved loader
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
        <p className="text-sm text-gray-500 mt-2">Please wait while we verify your credentials.</p>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!user) {
    console.log("RequireAuth: No user, redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If this is a handler, ALWAYS redirect them to the customer dashboard
  // This ensures handlers can NEVER access admin/staff routes
  if (isHandler) {
    console.log("RequireAuth: Handler detected, forcing redirect to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }

  // If authenticated and not a handler, render children
  return <>{children}</>;
}
