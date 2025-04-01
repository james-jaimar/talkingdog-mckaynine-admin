
import { Link } from "react-router-dom";
import { useBranch } from "@/context/BranchContext";
import { BranchSelector } from "@/components/branches/BranchSelector";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { currentBranch } = useBranch();
  const { user, signOut, isAdmin, isTrainer } = useAuth();

  // Only show branch selector for admin and trainer roles
  const showBranchSelector = user && (isAdmin || isTrainer);

  return (
    <header className="bg-mckaynine-600 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl mr-4">
              McKaynine
            </Link>
            
            {user && (
              <nav className="flex space-x-4 overflow-x-auto">
                <Link to="/" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                  Dashboard
                </Link>
                <Link to="/handlers" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                  Handlers
                </Link>
                <Link to="/classes" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                  Classes
                </Link>
                <Link to="/class-schedules" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                  Class Schedules
                </Link>
                <Link to="/trainers" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                  Trainers
                </Link>
                {isAdmin && (
                  <>
                    <Link to="/branches" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                      Branches
                    </Link>
                    <Link to="/unpaid-handlers" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                      Unpaid Handlers
                    </Link>
                  </>
                )}
              </nav>
            )}
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
