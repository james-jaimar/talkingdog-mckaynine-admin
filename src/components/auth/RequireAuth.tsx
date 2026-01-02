
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading, role, isHandler } = useAuth();
  const location = useLocation();
  
  // Check onboarding status for handlers
  const { status: onboardingStatus, isLoading: onboardingLoading } = useOnboardingStatus(
    user?.id,
    isHandler || role === 'handler'
  );
  
  // Debug info
  console.log("RequireAuth - Path:", location.pathname, "User:", !!user, "Role:", role, "Onboarding:", onboardingStatus);

  // Always handle loading first
  if (isLoading || (isHandler && onboardingLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
      </div>
    );
  }

  // No user means go to auth
  if (!user) {
    console.log("RequireAuth - No user, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // STRICT SECURITY CHECK: Handlers should ONLY access customer routes
  // If the handler tries to access any non-customer route, redirect them
  if (role === 'handler' || role === 'user') {
    if (!location.pathname.startsWith("/customer/")) {
      console.log("RequireAuth - Handler accessing restricted route, redirecting to /customer/dashboard");
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  // ONBOARDING GATE: If handler has incomplete onboarding, redirect to form
  // Allow the form route itself to avoid redirect loop
  const isOnFormRoute = location.pathname === "/customer/forms/puppy-class";
  
  if ((isHandler || role === 'handler') && onboardingStatus === 'pending' && !isOnFormRoute) {
    console.log("RequireAuth - Handler onboarding incomplete, redirecting to registration form");
    return <Navigate to="/customer/forms/puppy-class" replace />;
  }

  // Authenticated and authorized
  return <>{children}</>;
}
