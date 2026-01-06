
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
import { TermSelectorRow } from "./header/TermSelectorRow";

export function Header() {
  const { user, logout, isAdmin, isTrainer, isHandler, role } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHorizontalWheel: React.WheelEventHandler<HTMLElement> = (e) => {
    // If user scrolls vertically over a horizontally-scrollable nav, translate it to horizontal scroll
    if (e.deltaY === 0) return;
    const el = e.currentTarget as HTMLElement;
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  };
  
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
    <header className="bg-mckaynine-600 sticky top-0 z-50 shadow-md">
      {/* Main Row: Logo, Primary Navigation, Branch Selector, and User Info */}
      <div className="border-b border-mckaynine-700">
        <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <Link to={isHandler ? "/customer/dashboard" : "/"} className="hover:opacity-90 transition-opacity">
                  <img 
                    src="/lovable-uploads/mckaynine_delta_long_2025.png" 
                    alt="McKaynine Delta" 
                    className="h-10 w-auto"
                  />
                </Link>
                
                {user && !isMobile && (
                  <div
                    className="hidden md:block flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-hide"
                    onWheel={handleHorizontalWheel}
                  >
                    {isAdmin ? (
                      <AdminNavigation isMobile={false} showPrimaryOnly={true} />
                    ) : isTrainer && !isAdmin ? (
                      <TrainerNavigation isMobile={false} showPrimaryOnly={true} />
                    ) : isHandler && (
                      <HandlerNavigation isMobile={false} />
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 flex-shrink-0">
                {showBranchSelector && currentBranch && !isMobile && (
                  <BranchSelector />
                )}
              
              {user && (
                <div className="flex items-center gap-2">
                  <UserSection 
                    email={user.email} 
                    role={role} 
                    isMobile={isMobile}
                    onLogout={null}
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

      {/* Secondary Row: Secondary Navigation and Logout */}
      {user && !isMobile && (
        <div className="hidden md:block bg-mckaynine-700">
            <div className="container mx-auto px-4 py-1">
              <div className="flex justify-between items-center gap-4">
                <div
                  className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-hide"
                  onWheel={handleHorizontalWheel}
                >
                  {isAdmin ? (
                    <AdminNavigation isMobile={false} showPrimaryOnly={false} />
                  ) : isTrainer && !isAdmin ? (
                    <TrainerNavigation isMobile={false} showPrimaryOnly={false} />
                  ) : null}
                </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                className="text-white hover:bg-red-700 flex-shrink-0"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Term Selector Row */}
      {user && !isMobile && <TermSelectorRow />}
      
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
