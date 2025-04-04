
import { Navigate, Outlet } from "react-router-dom";
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
  
  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }
  
  // Redirect to unified auth page if not logged in
  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to auth page");
    return <Navigate to="/auth" replace />;
  }
  
  // If user is a handler, ALWAYS redirect to customer dashboard regardless of the route
  // This ensures handlers can never access admin pages
  if (isHandler) {
    console.log("ProtectedRoute: Handler detected, forcing redirect to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // For non-handlers, check for required role if specified
  if (requiredRole) {
    const hasPermission = (
      (requiredRole === 'admin' && isAdmin) || 
      (requiredRole === 'trainer' && (isAdmin || isTrainer))
    );
    
    if (!hasPermission) {
      console.log("ProtectedRoute: User lacks required role, redirecting to home");
      return <Navigate to="/" replace />;
    }
  }
  
  // If children exist, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
};
