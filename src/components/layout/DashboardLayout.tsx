
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
  
  // Simplified redirection effect
  useEffect(() => {
    // Skip if still loading auth state
    if (isLoading) return;
    
    // Require auth check - redirect to login if not authenticated
    if (requireAuth && !user) {
      navigate("/auth", { state: { from: location }, replace: true });
      return;
    }
    
    // Handler on wrong route check - but only if not already on customer route
    // This prevents infinite redirect loops
    if (user && isHandler && requireAuth && !location.pathname.startsWith("/customer/")) {
      navigate("/customer/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate, requireAuth, isHandler, location]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }

  // Don't render anything if auth check fails and we're redirecting
  if (requireAuth && !user) {
    return null;
  }
  
  // Don't render for handlers on non-customer routes (will be redirected)
  if (requireAuth && user && isHandler && !location.pathname.startsWith("/customer/")) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Redirecting...</span>
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
