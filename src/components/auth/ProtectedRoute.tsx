
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
  const { user, isLoading, role, isAdmin, isTrainer, isHandler } = useAuth();
  const location = useLocation();
  
  // Enhanced debug info
  console.log("ProtectedRoute - Path:", location.pathname, "Required role:", requiredRole, "User role:", role);
  
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

  // STRICT SECURITY CHECK: Handlers can only access customer routes
  if ((role === 'handler' || role === 'user') && !location.pathname.startsWith("/customer/")) {
    console.log("ProtectedRoute - Handler trying to access staff route, redirecting to /customer/dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // Role-based access check
  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'admin' && isAdmin) ||
      (requiredRole === 'trainer' && isTrainer) ||
      (requiredRole === 'handler' && (role === 'handler' || role === 'user'));
      
    if (!hasRequiredRole) {
      console.log(`ProtectedRoute - User doesn't have required role: ${requiredRole}`);
      
      // Role-specific redirection
      if (role === 'handler' || role === 'user') {
        return <Navigate to="/customer/dashboard" replace />;
      } else if (role === 'admin') {
        return <Navigate to="/dashboard" replace />;
      } else if (role === 'trainer') {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }
  
  // Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};
