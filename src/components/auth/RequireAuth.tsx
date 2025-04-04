
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { ReactNode, useEffect } from "react";
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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if a handler is trying to access an admin page
  const isAdminRoute = location.pathname.startsWith('/dashboard') || 
                      location.pathname.startsWith('/handlers') || 
                      location.pathname.startsWith('/classes') || 
                      location.pathname.startsWith('/trainers') || 
                      location.pathname.startsWith('/class-schedules') || 
                      location.pathname.startsWith('/branches') || 
                      location.pathname.startsWith('/unpaid-handlers') || 
                      location.pathname.startsWith('/forms') || 
                      location.pathname.startsWith('/user-admin');
  
  const isRootRoute = location.pathname === '/';
  
  // If this is a handler trying to access an admin route or the root route, redirect to customer dashboard
  if (isHandler && (isAdminRoute || isRootRoute)) {
    console.log("Handler attempting to access restricted route, redirecting to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
}
