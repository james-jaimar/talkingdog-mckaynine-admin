
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
  
  // Always handle loading state first
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }
  
  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Handler check - only redirect if not already on customer path
  if (isHandler && !location.pathname.startsWith("/customer/")) {
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // Role-based access check
  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'admin' && isAdmin) || 
      (requiredRole === 'trainer' && isTrainer) ||
      (requiredRole === 'handler' && isHandler);
    
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on role
      return <Navigate to={isHandler ? "/customer/dashboard" : "/"} replace />;
    }
  }
  
  // Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};
