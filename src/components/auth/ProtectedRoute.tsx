
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'admin' | 'trainer' | 'handler' | undefined;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading, isAdmin, isTrainer, isHandler } = useAuth();
  const location = useLocation();
  
  // Add clear debug logging
  console.log("ProtectedRoute Check:", { 
    authenticated: !!user, 
    isHandler, 
    path: location.pathname, 
    requiredRole,
    isLoading
  });
  
  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }
  
  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // CRITICAL HANDLER CHECK: Always redirect handlers to customer dashboard
  // This must be the first check after authentication
  if (isHandler && !location.pathname.startsWith("/customer/")) {
    console.log("ProtectedRoute: HANDLER DETECTED on non-customer route:", location.pathname);
    console.log("ProtectedRoute: FORCE redirecting to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // For non-handlers, check required role if specified
  if (requiredRole) {
    const hasPermission = (
      (requiredRole === 'admin' && isAdmin) || 
      (requiredRole === 'trainer' && (isAdmin || isTrainer))
    );
    
    if (!hasPermission) {
      return <Navigate to="/" replace />;
    }
  }
  
  // Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};
