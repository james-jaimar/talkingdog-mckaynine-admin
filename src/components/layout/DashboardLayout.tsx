
import { Header } from "./Header";
import { useNavigate } from "react-router-dom";
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
  
  // Strict handler redirection logic
  useEffect(() => {
    if (isLoading) return;
    
    // Handler role check - MUST BE ON CUSTOMER ROUTES
    if (user && isHandler && !window.location.pathname.startsWith("/customer/")) {
      console.log("DashboardLayout: Handler detected on non-customer route, redirecting");
      navigate("/customer/dashboard", { replace: true });
      return;
    }
    
    // Regular auth check
    if (requireAuth && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, isLoading, navigate, requireAuth, isHandler]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
      </div>
    );
  }

  // Render nothing if auth check fails (redirects will happen)
  if (requireAuth && !user) return null;
  
  // Don't render main layout for handlers on non-customer routes
  if (user && isHandler && !window.location.pathname.startsWith("/customer/")) {
    return null;
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
