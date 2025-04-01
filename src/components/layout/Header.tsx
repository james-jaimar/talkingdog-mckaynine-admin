
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBranch } from "@/context/BranchContext";
import { BranchSelector } from "@/components/branches/BranchSelector";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
  const { pathname } = useLocation();
  const { currentBranch } = useBranch();
  const { user, signOut, isAdmin, isTrainer } = useAuth();
  const [pageTitle, setPageTitle] = useState("Dashboard");

  // Map routes to page titles
  useEffect(() => {
    const routeTitles: Record<string, string> = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/classes": "Classes",
      "/class-schedules": "Class Schedules",
      "/trainers": "Trainers",
      "/handlers": "Handlers",
      "/branches": "Branches",
      "/unpaid-handlers": "Unpaid Handlers",
      "/auth": "Authentication",
    };

    // Extract the base route (e.g., /handlers/123 -> /handlers)
    const baseRoute = pathname.split("/").slice(0, 2).join("/") || "/";
    setPageTitle(routeTitles[baseRoute] || "McKaynine Training Centre");
  }, [pathname]);

  // Only show branch selector for admin and trainer roles
  const showBranchSelector = user && (isAdmin || isTrainer);

  return (
    <header className="bg-mckaynine-600 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden mr-2 text-white hover:text-white hover:bg-mckaynine-700" />
            <Link to="/" className="text-white font-bold text-xl mr-4">
              McKaynine
            </Link>
            
            <nav className="hidden md:flex space-x-4">
              <Link to="/" className="text-white hover:text-gray-200 px-2 py-1 rounded">
                Dashboard
              </Link>
              <Link to="/handlers" className="text-white hover:text-gray-200 px-2 py-1 rounded">
                Handlers
              </Link>
              <Link to="/classes" className="text-white hover:text-gray-200 px-2 py-1 rounded">
                Classes
              </Link>
              <Link to="/trainers" className="text-white hover:text-gray-200 px-2 py-1 rounded">
                Trainers
              </Link>
              {isAdmin && (
                <Link to="/branches" className="text-white hover:text-gray-200 px-2 py-1 rounded">
                  Branches
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {showBranchSelector && currentBranch && (
              <BranchSelector />
            )}
            
            {user && (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-flex items-center">
                  <User className="inline-block mr-1 h-4 w-4" />
                  {user.email}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="text-white hover:text-white hover:bg-mckaynine-700"
                >
                  <LogOut className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
