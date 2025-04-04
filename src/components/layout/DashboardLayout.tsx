
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
  const { user, isLoading, isHandler, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check both isHandler flag and explicit role
  const userIsHandler = isHandler || role === 'handler';
  
  // Simplified redirection effect
  useEffect(() => {
    // Skip if still loading auth state
    if (isLoading) return;
    
    // Debug info
    console.log("DashboardLayout - Path:", location.pathname, "User:", !!user, "Handler:", userIsHandler, "Role:", role);
    
    // Require auth check - redirect to login if not authenticated
    if (requireAuth && !user) {
      console.log("DashboardLayout - No user, redirecting to /auth");
      navigate("/auth", { replace: true });
      return;
    }
    
    // Handler on wrong route check - redirect handlers to customer dashboard if they're on staff routes
    if (user && userIsHandler && requireAuth && 
        !location.pathname.startsWith("/customer/") && 
        !location.pathname.startsWith("/auth")) {
      console.log("DashboardLayout - Handler on wrong route, redirecting to /customer/dashboard");
      navigate("/customer/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate, requireAuth, userIsHandler, location.pathname, role]);

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
  if (requireAuth && user && userIsHandler && !location.pathname.startsWith("/customer/")) {
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
