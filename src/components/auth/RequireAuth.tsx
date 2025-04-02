
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth"; // Fixed import path
import { ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // If still loading auth state, render nothing (or a loader)
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
}
