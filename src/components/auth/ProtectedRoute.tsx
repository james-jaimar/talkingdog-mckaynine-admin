
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
  
  // Enhanced logging for debugging
  console.log("ProtectedRoute Check:", { 
    authenticated: !!user, 
    isHandler, 
    path: location.pathname, 
    requiredRole,
    isLoading
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }
  
  // Not authenticated
  if (!user) {
    console.log("ProtectedRoute: Not authenticated - redirecting to auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // CRITICAL: Handler check is now the first priority after authentication check
  // This ensures handlers can ONLY access customer routes
  if (isHandler) {
    if (!location.pathname.startsWith("/customer/")) {
      console.log("ProtectedRoute: HANDLER DETECTED on unauthorized route:", location.pathname);
      console.log("ProtectedRoute: FORCING redirect to customer dashboard");
      return <Navigate to="/customer/dashboard" replace />;
    }
    
    // If we're explicitly requiring a role that isn't handler, redirect
    if (requiredRole && requiredRole !== 'handler') {
      console.log("ProtectedRoute: Handler attempting to access route requiring", requiredRole);
      return <Navigate to="/customer/dashboard" replace />;
    }
  }
  
  // For non-handlers, check required role if specified
  if (requiredRole && !isHandler) {
    const hasPermission = (
      (requiredRole === 'admin' && isAdmin) || 
      (requiredRole === 'trainer' && (isAdmin || isTrainer))
    );
    
    if (!hasPermission) {
      console.log("ProtectedRoute: Insufficient permissions for route");
      return <Navigate to="/" replace />;
    }
  }
  
  // Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};
