import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, BookOpen, Calendar, GraduationCap, FileText, Menu, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { UserNav } from "@/components/layout/UserNav";
import { useAuth } from "@/context/auth";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-4 border-b">
          <img 
            src="/lovable-uploads/10dc7b2d-7c92-4408-8a71-edaf248918a0.png" 
            alt="McKaynine" 
            className="h-8"
            onClick={() => navigate('/dashboard')} 
          />
        </div>
        <div className="py-4">
          <nav className="flex flex-col space-y-1 px-2">
            <Button
              variant="ghost"
              className={`justify-start ${isActive('/dashboard') ? 'bg-gray-100' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start ${isActive('/handlers') ? 'bg-gray-100' : ''}`}
              onClick={() => navigate('/handlers')}
            >
              <Users className="mr-2 h-4 w-4" />
              Handlers
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start ${isActive('/classes') ? 'bg-gray-100' : ''}`}
              onClick={() => navigate('/classes')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Classes
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start ${isActive('/class-schedules') ? 'bg-gray-100' : ''}`}
              onClick={() => navigate('/class-schedules')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedules
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start ${isActive('/trainers') ? 'bg-gray-100' : ''}`}
              onClick={() => navigate('/trainers')}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Trainers
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start ${isActive('/invoices') ? 'bg-gray-100' : ''}`}
              onClick={() => navigate('/invoices')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Invoices
            </Button>
          </nav>
        </div>
      </div>
      
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
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
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
