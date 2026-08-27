

import { Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import CustomerLogin from "@/pages/CustomerLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import PublicPuppyClassForm from "@/pages/PublicPuppyClassForm";
import PublicPuppyClassEnrol from "@/pages/PublicPuppyClassEnrol";
import PuppyClassPrivacyNotice from "@/pages/PuppyClassPrivacyNotice";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";
import { RoleConfigurationError } from "@/components/auth/RoleConfigurationError";
import { getHomeRouteForRole } from "@/lib/auth/roleRouting";

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
  
  const destination = getHomeRouteForRole(role);
  if (!destination) {
    console.error("HandlerRedirect - Authenticated user has no recognized role");
    return <RoleConfigurationError />;
  }

  console.log(`HandlerRedirect - Redirecting to ${destination}`);
  return <Navigate to={destination} replace />;
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
  {
    path: "/register/puppy-class",
    element: <PublicPuppyClassForm />,
  },
  {
    path: "/register/puppy-class/enrol",
    element: <PublicPuppyClassEnrol />,
  },
  {
    path: "/register/puppy-class/privacy",
    element: <PuppyClassPrivacyNotice />,
  },
];
