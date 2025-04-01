
import { Header } from "./Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

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
        navigate("/auth");
      } else if (!requireAuth && user) {
        // Redirect to dashboard if user is already logged in and tries to access non-auth pages
        navigate("/");
      }
    }
  }, [user, isLoading, navigate, requireAuth]);

  // Show nothing while authentication is being checked
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
