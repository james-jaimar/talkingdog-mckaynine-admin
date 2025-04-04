
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
  
  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Early handler redirect - ALWAYS redirect handlers to customer dashboard
  if (isHandler) {
    console.log("ProtectedRoute: Handler detected, redirecting to customer dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // For non-handlers, check required role
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
