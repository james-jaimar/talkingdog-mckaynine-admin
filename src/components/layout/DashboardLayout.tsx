
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, BookOpen, Calendar, GraduationCap, FileText, Menu, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { UserNav } from "@/components/layout/UserNav";
import { useAuth } from "@/context/auth";
import { Header } from "@/components/layout/Header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Handlers", path: "/handlers", icon: <Users className="h-5 w-5" /> },
    { name: "Classes", path: "/classes", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Schedules", path: "/class-schedules", icon: <Calendar className="h-5 w-5" /> },
    { name: "Trainers", path: "/trainers", icon: <GraduationCap className="h-5 w-5" /> },
    { name: "Forms", path: "/forms", icon: <FileText className="h-5 w-5" /> },
  ];

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
