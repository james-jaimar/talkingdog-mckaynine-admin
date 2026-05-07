

import { Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import CustomerLogin from "@/pages/CustomerLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import PublicPuppyClassForm from "@/pages/PublicPuppyClassForm";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

// Simple loading screen component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
    <span className="text-lg text-mckaynine-600">Loading...</span>
  </div>
);

// Root redirect based on authentication state
export const HandlerRedirect = () => {
  const { user, isLoading, role, isPlatformAdmin } = useAuth();
  
  console.log("HandlerRedirect - Auth state:", { 
    user: !!user, 
    isLoading, 
    role,
    isPlatformAdmin,
    path: window.location.pathname
  });
  
  // Always show loading while authentication is in progress
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Not logged in - go to auth
  if (!user) {
    console.log("HandlerRedirect - No user, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }
  
  // Priority-based redirect for multi-role users (e.g. "assistant,trainer")
  // Higher-privilege roles take priority
  if (role?.includes('platform_admin') || role?.includes('admin')) {
    console.log("HandlerRedirect - User has admin role, redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  } else if (role?.includes('trainer')) {
    console.log("HandlerRedirect - User has trainer role, redirecting to /trainer/dashboard");
    return <Navigate to="/trainer/dashboard" replace />;
  } else if (role?.includes('assistant')) {
    console.log("HandlerRedirect - User has assistant role, redirecting to /assistant/schedule");
    return <Navigate to="/assistant/schedule" replace />;
  } else if (role?.includes('handler') || role?.includes('user')) {
    console.log("HandlerRedirect - User has handler/user role, redirecting to /customer/dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  } else {
    console.log("HandlerRedirect - Unknown role, redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }
};

export const publicRoutes = [
  {
    path: "/",
    element: <HandlerRedirect />,
    errorElement: <NotFound />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  // Dedicated customer/handler login page
  {
    path: "/customer-login",
    element: <CustomerLogin />,
  },
  // Legacy route redirect
  {
    path: "/customer/login",
    element: <Navigate to="/customer-login" replace />,
  },
  // Password reset flow
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
];
