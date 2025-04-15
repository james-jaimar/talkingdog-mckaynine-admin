
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBranch } from "@/context/BranchContext";
import { BranchSelector } from "@/components/branches/BranchSelector";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AdminNavigation } from "./header/AdminNavigation";
import { TrainerNavigation } from "./header/TrainerNavigation";
import { HandlerNavigation } from "./header/HandlerNavigation";
import { UserSection } from "./header/UserSection";
import { Branch } from "@/context/BranchContext";

export function Header() {
  const { user, logout, isAdmin, isTrainer, isHandler, role } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  let branchInfo = { currentBranch: null as Branch | null };
  try {
    branchInfo = useBranch();
  } catch (error) {
    console.error("Error accessing branch context:", error);
  }
  
  const { currentBranch } = branchInfo;
  const showBranchSelector = user && (isAdmin || isTrainer);

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
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-mckaynine-600 text-white sticky top-0 z-50 shadow-md">
      {/* Main Row: Logo, Navigation, Branch Selector, and User Info */}
      <div className="border-b border-mckaynine-700">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to={isHandler ? "/customer/dashboard" : "/"} className="text-white font-bold text-xl">
                McKaynine
              </Link>
              
              {user && !isMobile && (
                <div className="hidden md:block">
                  {isAdmin ? (
                    <AdminNavigation isMobile={false} />
                  ) : isTrainer && !isAdmin ? (
                    <TrainerNavigation isMobile={false} />
                  ) : isHandler && (
                    <HandlerNavigation isMobile={false} />
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {showBranchSelector && currentBranch && !isMobile && (
                <BranchSelector />
              )}
              
              {user && (
                <div className="flex items-center gap-2">
                  <UserSection 
                    email={user.email} 
                    role={role} 
                    isMobile={isMobile}
                    onLogout={null}  // We'll handle logout in the second row
                  />
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="ml-2 text-white"
                    >
                      {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Logout Button */}
      {user && !isMobile && (
        <div className="hidden md:block bg-mckaynine-700">
          <div className="container mx-auto px-4 py-1">
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                className="text-white hover:bg-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && user && (
        <div className="bg-mckaynine-700 py-2">
          <div className="container mx-auto px-4">
            {showBranchSelector && currentBranch && (
              <div className="mb-3 pt-2 border-t border-mckaynine-500">
                <BranchSelector />
              </div>
            )}
            
            {isAdmin ? (
              <AdminNavigation isMobile={true} onMobileClose={() => setMobileMenuOpen(false)} />
            ) : isTrainer && !isAdmin ? (
              <TrainerNavigation isMobile={true} onMobileClose={() => setMobileMenuOpen(false)} />
            ) : isHandler && (
              <HandlerNavigation isMobile={true} onMobileClose={() => setMobileMenuOpen(false)} />
            )}
            
            <div className="mt-4 pt-4 border-t border-mckaynine-500">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                className="w-full text-white hover:bg-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
