
import { Header } from "./Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function DashboardLayout({ children, requireAuth = true }: DashboardLayoutProps) {
  const { user, isLoading, isHandler } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Debug logging
  console.log("DashboardLayout Check:", {
    authenticated: !!user,
    isHandler,
    path: location.pathname,
    requireAuth,
    isLoading
  });
  
  // Simplified redirection with anti-loop protection
  useEffect(() => {
    // Skip if already redirecting or still loading
    if (isRedirecting || isLoading) return;
    
    // Auth required but no user
    if (requireAuth && !user) {
      console.log("DashboardLayout: Auth required but no user - redirecting to auth");
      setIsRedirecting(true);
      navigate("/auth", { replace: true });
      return;
    }
    
    // Handler on non-customer route - but only if path doesn't already start with /customer/
    if (user && isHandler && !location.pathname.startsWith("/customer/")) {
      console.log("DashboardLayout: Handler on non-customer route:", location.pathname);
      setIsRedirecting(true);
      navigate("/customer/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate, requireAuth, isHandler, location.pathname, isRedirecting]);

  // Reset redirecting state when location changes
  useEffect(() => {
    setIsRedirecting(false);
  }, [location.pathname]);

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
