
import { Link } from "react-router-dom";
import { useBranch, Branch } from "@/context/BranchContext";
import { BranchSelector } from "@/components/branches/BranchSelector";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Users, Clipboard, FileText } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, logout, isAdmin, isTrainer, role, trainerProfile } = useAuth();
  
  // Safely use useBranch hook with proper typing
  let branchInfo = { currentBranch: null as Branch | null };
  try {
    branchInfo = useBranch();
  } catch (error) {
    console.error("Error accessing branch context:", error);
  }
  
  const { currentBranch } = branchInfo;

  // Only show branch selector for admin and trainer roles
  const showBranchSelector = user && (isAdmin || isTrainer);
  
  // Reduced debugging output - only log once during render
  if (user && process.env.NODE_ENV === 'development') {
    console.log(
      "Header - User info:", 
      { email: user?.email, role, isAdmin, isTrainer, trainerProfile }
    );
  }

  // Handle logout with proper error handling
  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        toast.success("Successfully logged out");
      } else if (result.error) {
        toast.error(`Logout error: ${result.error}`);
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      toast.error("An unexpected error occurred during logout");
    }
  };

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
                {isTrainer && !isAdmin ? (
                  <>
                    <Link to="/trainer-dashboard" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                      <Clipboard className="inline-block mr-1 h-4 w-4" />
                      My Dashboard
                    </Link>
                    <Link to="/class-schedules" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                      Class Schedules
                    </Link>
                    <Link to="/handlers" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                      Handlers
                    </Link>
                  </>
                ) : (
                  <>
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
                        <Link to="/forms" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                          <FileText className="inline-block mr-1 h-4 w-4" />
                          Forms
                        </Link>
                        <Link to="/user-admin" className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap">
                          <Users className="inline-block mr-1 h-4 w-4" />
                          User Admin
                        </Link>
                      </>
                    )}
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
                  {isAdmin && <span className="ml-1 text-xs bg-blue-600 px-1.5 py-0.5 rounded">Admin</span>}
                  {isTrainer && !isAdmin && <span className="ml-1 text-xs bg-green-600 px-1.5 py-0.5 rounded">Trainer</span>}
                  {trainerProfile && <span className="ml-1 text-xs">{trainerProfile.first_name}</span>}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
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
