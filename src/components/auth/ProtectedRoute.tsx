
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  // Show nothing while loading
  if (isLoading) {
    return null;
  }
  
  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // If children exist, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
};
