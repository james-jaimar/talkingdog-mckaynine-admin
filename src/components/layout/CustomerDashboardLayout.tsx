
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, User, MessageSquare, Menu, ExternalLink, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { UserNav } from "@/components/layout/UserNav";
import { useAuth } from "@/context/auth";
import { Header } from "@/components/layout/Header";

export function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();

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
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
