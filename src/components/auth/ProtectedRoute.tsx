
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
  const { user, isLoading, isAdmin, isTrainer, isHandler, role } = useAuth();
  const location = useLocation();
  
  // Ensure consistent handler identification
  const userIsHandler = isHandler || role === 'handler';
  
  // Debug info with added role information
  console.log("ProtectedRoute - Path:", location.pathname, "Required role:", requiredRole, "User roles:", { 
    isAdmin, 
    isTrainer, 
    isHandler: userIsHandler,
    actualRole: role 
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
  
  // Not authenticated - redirect to auth
  if (!user) {
    console.log("ProtectedRoute - No user, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // IMPORTANT: Handler redirection logic - must happen before other role checks
  // Only redirect if not already on a customer path
  if (userIsHandler && !location.pathname.startsWith("/customer/")) {
    console.log("ProtectedRoute - Handler on wrong path, redirecting to /customer/dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // Role-based access check
  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'admin' && isAdmin) || 
      (requiredRole === 'trainer' && isTrainer) ||
      (requiredRole === 'handler' && userIsHandler);
    
    if (!hasRequiredRole) {
      console.log("ProtectedRoute - User doesn't have required role:", requiredRole);
      // Redirect to appropriate dashboard based on role
      return <Navigate to={userIsHandler ? "/customer/dashboard" : "/"} replace />;
    }
  }
  
  // Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};
