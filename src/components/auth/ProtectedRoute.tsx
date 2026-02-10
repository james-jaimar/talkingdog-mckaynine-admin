
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'platform_admin' | 'admin' | 'trainer' | 'handler' | undefined;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading, role, isAdmin, isPlatformAdmin, isTrainer, isHandler } = useAuth();
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

  // STRICT SECURITY CHECK: Pure handlers (no staff roles) can only access customer routes
  const hasHandlerRole = role?.includes('handler') || role?.includes('user');
  const hasStaffRole = role?.includes('admin') || role?.includes('platform_admin') || role?.includes('trainer') || role?.includes('assistant');
  
  if (hasHandlerRole && !hasStaffRole && !location.pathname.startsWith("/customer/")) {
    console.log("ProtectedRoute - Pure handler trying to access staff route, redirecting to /customer/dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // Role-based access check
  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'platform_admin' && isPlatformAdmin) ||
      (requiredRole === 'admin' && (isAdmin || isPlatformAdmin)) ||
      (requiredRole === 'trainer' && (isTrainer || isAdmin || isPlatformAdmin)) ||
      (requiredRole === 'handler' && (isHandler || role?.includes('handler') || role?.includes('user')));
      
    if (!hasRequiredRole) {
      console.log(`ProtectedRoute - User doesn't have required role: ${requiredRole}`);
      
      // Role-specific redirection when user doesn't have required role
      if (hasHandlerRole && !hasStaffRole) {
        return <Navigate to="/customer/dashboard" replace />;
      } else if (role?.includes('trainer')) {
        return <Navigate to="/trainer/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }
  
  // Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};
