
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
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Handle authentication redirects
  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        // Redirect to auth page if authentication is required but user isn't logged in
        navigate("/auth", { replace: true });
      } else if (!requireAuth && user) {
        // Redirect to dashboard if user is already logged in and tries to access non-auth pages
        navigate("/", { replace: true });
      }
    }
  }, [user, isLoading, navigate, requireAuth]);

  // Show loading indicator while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
      </div>
    );
  }

  // If requiring auth but no user, render nothing (redirect will happen)
  if (requireAuth && !user) {
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
