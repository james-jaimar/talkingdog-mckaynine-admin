
import { Header } from "./Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function DashboardLayout({ children, requireAuth = true }: DashboardLayoutProps) {
  const { user, isLoading, isHandler } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Improved debugging logs
  console.log("DashboardLayout Check:", {
    authenticated: !!user,
    isHandler,
    path: location.pathname,
    requireAuth,
    isLoading
  });
  
  // Simplified and strict handler redirection logic
  useEffect(() => {
    // Don't do anything while still loading
    if (isLoading) return;
    
    // Auth required but no user - redirect to auth
    if (requireAuth && !user) {
      console.log("DashboardLayout: Auth required but no user - redirecting to auth");
      navigate("/auth", { replace: true });
      return;
    }
    
    // CRITICAL: Handler check with highest priority
    // Force redirect handlers to customer dashboard from ANY non-customer route
    if (user && isHandler && !location.pathname.startsWith("/customer/")) {
      console.log("DashboardLayout: HANDLER DETECTED on non-customer route:", location.pathname);
      console.log("DashboardLayout: FORCE redirecting to customer dashboard");
      navigate("/customer/dashboard", { replace: true });
      return;
    }
  }, [user, isLoading, navigate, requireAuth, isHandler, location.pathname]);

  // Loading indicator
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
      </div>
    );
  }

  // Don't render anything if auth check fails (redirects will happen)
  if (requireAuth && !user) return null;
  
  // Don't render main layout for handlers on non-customer routes
  // This is a failsafe in case the redirect hasn't happened yet
  if (user && isHandler && !location.pathname.startsWith("/customer/")) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Redirecting to customer dashboard...</span>
      </div>
    );
  }

  // Render normal layout
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100">
      {(user || !requireAuth) && <Header />}
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children}
      </main>
      
      <footer className="border-t py-4 px-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} McKaynine Training Centre
      </footer>
    </div>
  );
}
