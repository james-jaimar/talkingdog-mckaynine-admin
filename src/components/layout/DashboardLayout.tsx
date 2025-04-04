
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
  
  // Handle authentication redirects
  useEffect(() => {
    console.log("DashboardLayout - Auth state:", { user: !!user, isLoading, isHandler });
    
    if (!isLoading) {
      if (requireAuth && !user) {
        // Redirect to unified auth page if authentication is required but user isn't logged in
        console.log("DashboardLayout - Redirecting to auth page (no user)");
        navigate("/auth", { replace: true });
      } else if (!requireAuth && user) {
        // Redirect to appropriate dashboard if user is already logged in
        console.log("DashboardLayout - Redirecting to dashboard (user already logged in)");
        if (isHandler) {
          navigate("/customer/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else if (user && isHandler && window.location.pathname === "/dashboard") {
        // Redirect handlers to customer dashboard if they try to access admin dashboard
        console.log("DashboardLayout - Redirecting handler to customer dashboard");
        navigate("/customer/dashboard", { replace: true });
      }
    }
  }, [user, isLoading, navigate, requireAuth, isHandler]);

  // Show loading indicator while authentication is being checked
  if (isLoading) {
    console.log("DashboardLayout - Showing loading indicator");
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-mckaynine-600 mb-4" />
        <span className="text-lg text-mckaynine-600">Authenticating...</span>
        <p className="text-sm text-gray-500 mt-2">Please wait while we load your dashboard.</p>
      </div>
    );
  }

  // If requiring auth but no user, render nothing (redirect will happen)
  if (requireAuth && !user) {
    console.log("DashboardLayout - Not rendering (no user)");
    return null;
  }

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
