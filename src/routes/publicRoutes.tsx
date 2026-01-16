

import { Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import CustomerLogin from "@/pages/CustomerLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
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
  
  // STRICT SECURITY CHECK for handlers
  // Any user with 'handler' or 'user' role gets sent to customer dashboard
  if (role === 'handler' || role === 'user') {
    console.log("HandlerRedirect - User is a handler, redirecting to /customer/dashboard");
    return <Navigate to="/customer/dashboard" replace />;
  } else if (role === 'trainer') {
    // Pure trainers (role is exactly 'trainer', not combined with admin) go to trainer dashboard
    // Note: Users with 'admin' or 'platform_admin' role will fall through to dashboard even if also trainers
    console.log("HandlerRedirect - User is a pure trainer, redirecting to /trainer/dashboard");
    return <Navigate to="/trainer/dashboard" replace />;
  } else {
    // For admin and platform_admin roles, go to staff dashboard
    console.log("HandlerRedirect - User is staff/admin, redirecting to /dashboard");
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
