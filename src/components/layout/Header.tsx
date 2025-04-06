
import { Link, useLocation } from "react-router-dom";
import { useBranch, Branch } from "@/context/BranchContext";
import { BranchSelector } from "@/components/branches/BranchSelector";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Users, Clipboard, FileText, MessageSquare, Home, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, logout, isAdmin, isTrainer, isHandler, role, trainerProfile } = useAuth();
  const location = useLocation();
  
  // Determine if we're on a customer page
  const isCustomerPage = location.pathname.startsWith('/customer');
  
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
      { email: user?.email, role, isAdmin, isTrainer, isHandler, trainerProfile }
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

  // Organize navigation items into primary and secondary rows
  const primaryNavItems = [
    { name: "Dashboard", path: isHandler ? "/customer/dashboard" : "/", icon: <Home className="inline-block mr-1 h-4 w-4" /> },
  ];
  
  // Handler navigation
  const handlerNavItems = [
    { name: "Profile", path: "/customer/profile", icon: null },
    { name: "Messages", path: "/customer/messages", icon: <MessageSquare className="inline-block mr-1 h-4 w-4" /> },
  ];
  
  // Trainer navigation (non-admin)
  const trainerNavItems = [
    { name: "My Dashboard", path: "/trainer-dashboard", icon: <Clipboard className="inline-block mr-1 h-4 w-4" /> },
    { name: "Class Schedules", path: "/class-schedules", icon: null },
    { name: "Handlers", path: "/handlers", icon: null },
  ];
  
  // Admin primary navigation
  const adminPrimaryNavItems = [
    { name: "Dashboard", path: "/", icon: null },
    { name: "Handlers", path: "/handlers", icon: null },
    { name: "Classes", path: "/classes", icon: null },
    { name: "Class Schedules", path: "/class-schedules", icon: null },
    { name: "Trainers", path: "/trainers", icon: null },
  ];
  
  // Admin secondary navigation
  const adminSecondaryNavItems = [
    { name: "Branches", path: "/branches", icon: null },
    { name: "Unpaid Handlers", path: "/unpaid-handlers", icon: null },
    { name: "Forms", path: "/forms", icon: <FileText className="inline-block mr-1 h-4 w-4" /> },
    { name: "Invoices", path: "/invoices", icon: <DollarSign className="inline-block mr-1 h-4 w-4" /> },
    { name: "User Admin", path: "/user-admin", icon: <Users className="inline-block mr-1 h-4 w-4" /> },
  ];

  return (
    <header className="bg-mckaynine-600 text-white sticky top-0 z-50 shadow-md">
      {/* Primary navigation row */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={isHandler ? "/customer/dashboard" : "/"} className="text-white font-bold text-xl mr-4">
              McKaynine
            </Link>
            
            {user && (
              <nav className="hidden md:flex space-x-4 overflow-x-auto">
                {isHandler ? (
                  // Primary navigation for handlers
                  <>
                    {primaryNavItems.map(item => (
                      <Link 
                        key={item.path}
                        to={item.path} 
                        className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap"
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
                  </>
                ) : isTrainer && !isAdmin ? (
                  // Primary navigation for trainers
                  <>
                    {adminPrimaryNavItems.slice(0, 5).map(item => (
                      <Link 
                        key={item.path}
                        to={item.path} 
                        className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap"
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
                  </>
                ) : (
                  // Primary navigation for admins
                  <>
                    {adminPrimaryNavItems.map(item => (
                      <Link 
                        key={item.path}
                        to={item.path} 
                        className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap"
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
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
                  {isHandler && <span className="ml-1 text-xs bg-amber-600 px-1.5 py-0.5 rounded">Handler</span>}
                  {trainerProfile && <span className="ml-1 text-xs">{trainerProfile.first_name}</span>}
                </span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-white hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Secondary navigation row */}
      {user && !isHandler && (
        <div className="bg-mckaynine-700">
          <div className="container mx-auto px-4 py-1">
            <nav className="flex space-x-4 overflow-x-auto">
              {isAdmin ? (
                // Secondary navigation for admins
                <>
                  {adminSecondaryNavItems.map(item => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className="text-white hover:text-gray-200 px-2 py-1 text-sm rounded whitespace-nowrap"
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </>
              ) : isTrainer ? (
                // Secondary navigation for trainers
                <>
                  <Link to="/invoices" className="text-white hover:text-gray-200 px-2 py-1 text-sm rounded whitespace-nowrap">
                    <DollarSign className="inline-block mr-1 h-4 w-4" />
                    Invoices
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      )}
      
      {/* Mobile navigation toggle button - only shown on small screens */}
      <div className="md:hidden container mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          {user && (
            <nav className="flex space-x-2 overflow-x-auto">
              {isHandler ? (
                // Mobile navigation for handlers
                <>
                  {handlerNavItems.map(item => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className="text-white hover:text-gray-200 px-2 py-1 text-sm rounded whitespace-nowrap"
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </>
              ) : isTrainer && !isAdmin ? (
                // Mobile navigation for trainers
                <>
                  {trainerNavItems.map(item => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className="text-white hover:text-gray-200 px-2 py-1 text-sm rounded whitespace-nowrap"
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </>
              ) : null}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
