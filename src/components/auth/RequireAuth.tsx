
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

  // Critical handler check: if this is a handler trying to access a non-customer route,
  // immediately redirect to customer dashboard
  if (isHandler && !location.pathname.startsWith("/customer/")) {
    console.log("RequireAuth: Handler trying to access non-customer route, redirecting");
    return <Navigate to="/customer/dashboard" replace />;
  }

  // User is authenticated and has appropriate role for this route
  return <>{children}</>;
}
