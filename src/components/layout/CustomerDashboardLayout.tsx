
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, User, MessageSquare, Menu, ExternalLink, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { UserNav } from "@/components/layout/UserNav";
import { useAuth } from "@/context/auth";

export function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/customer-login');
    }
  }, [user, isLoading, navigate]);

  // Hidden while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Menu"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="w-full flex items-center justify-between">
            <div className="md:hidden">
              <img 
                src="/lovable-uploads/10dc7b2d-7c92-4408-8a71-edaf248918a0.png" 
                alt="McKaynine" 
                className="h-8" 
              />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Main Website
              </Button>
              <UserNav />
            </div>
          </div>
        </header>
        <main className="container mx-auto">{children}</main>
      </div>
    </div>
  );
}
