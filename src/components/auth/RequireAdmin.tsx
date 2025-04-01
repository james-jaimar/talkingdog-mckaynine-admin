
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { ReactNode } from "react";

interface RequireAdminProps {
  children: ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // If still loading auth state, render nothing (or a loader)
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated but not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and admin, render children
  return <>{children}</>;
}
