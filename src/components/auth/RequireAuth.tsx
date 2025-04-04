
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading, role } = useAuth();
  const location = useLocation();
  
  // Debug info
  console.log("RequireAuth - Path:", location.pathname, "User:", !!user, "Role:", role);

  // Always handle loading first
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
      </div>
    );
  }

  // No user means go to auth
  if (!user) {
    console.log("RequireAuth - No user, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Handlers should only access customer routes
  if (role === 'handler' && !location.pathname.startsWith("/customer/")) {
    console.log("RequireAuth - Handler on wrong route, redirecting to /customer/dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }

  // Authenticated and authorized
  return <>{children}</>;
}
