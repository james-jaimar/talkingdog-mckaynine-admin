
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
  
  // Debug logging
  console.log("ProtectedRoute Check:", { 
    authenticated: !!user, 
    isHandler, 
    path: location.pathname, 
    requiredRole,
    isLoading
  });
  
  // Always handle loading state first
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }
  
  // Not authenticated - always redirect to auth
  if (!user) {
    console.log("ProtectedRoute: Not authenticated - redirecting to auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Handler check - added path check to prevent redirect loops
  // Only redirect if not already on a customer path
  if (isHandler && !location.pathname.startsWith("/customer/")) {
    console.log("ProtectedRoute: Handler detected on non-customer route:", location.pathname);
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // Check if handler is trying to access a non-handler role protected route
  if (isHandler && requiredRole && requiredRole !== 'handler') {
    console.log("ProtectedRoute: Handler attempting to access route requiring", requiredRole);
    return <Navigate to="/customer/dashboard" replace />;
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
