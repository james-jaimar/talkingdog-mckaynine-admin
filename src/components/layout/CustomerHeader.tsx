import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/BranchContext";
import { getBranchLogo, getBranchDisplayName } from "@/lib/branchLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Home, User, FileText, MessageSquare, LogOut, ChevronDown, Dog } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const customerNavItems = [
  { name: "Dashboard", path: "/customer/dashboard", icon: Home },
  { name: "My Profile", path: "/customer/profile", icon: User },
  { name: "My Dogs", path: "/customer/profile", icon: Dog },
  { name: "Messages", path: "/customer/messages", icon: MessageSquare },
  { name: "Invoices", path: "/customer/invoices", icon: FileText },
];

export function CustomerHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get current branch for dynamic logo
  let branchName: string | null = null;
  try {
    const { currentBranch } = useBranch();
    branchName = currentBranch?.name || null;
  } catch {
    // BranchContext may not be available
  }
  
  const logoSrc = getBranchLogo(branchName);
  const logoAlt = getBranchDisplayName(branchName);

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

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (email?: string) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-customer-header-bg border-b border-customer-header-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/customer/dashboard" 
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img 
              src={logoSrc}
              alt={logoAlt}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center gap-1">
              {customerNavItems.slice(0, 4).map((item) => (
                <Link
                  key={item.path + item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.path)
                      ? "bg-customer-accent-light text-customer-accent"
                      : "text-muted-foreground hover:bg-customer-nav-hover hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* User Section */}
          <div className="flex items-center gap-3">
            {!isMobile && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 hover:bg-customer-nav-hover rounded-full pl-2 pr-3 py-1 h-auto"
                  >
                    <Avatar className="h-8 w-8 border-2 border-customer-accent">
                      <AvatarFallback className="bg-customer-accent text-customer-accent-foreground text-sm font-medium">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground hidden lg:inline max-w-32 truncate">
                      {user.email}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Customer Account</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/customer/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/customer/messages" className="cursor-pointer">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-foreground hover:bg-customer-nav-hover"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <div className="py-4 border-t border-customer-header-border animate-fade-in">
            <nav className="flex flex-col gap-1">
              {customerNavItems.map((item) => (
                <Link
                  key={item.path + item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive(item.path)
                      ? "bg-customer-accent-light text-customer-accent"
                      : "text-muted-foreground hover:bg-customer-nav-hover hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            {user && (
              <div className="mt-4 pt-4 border-t border-customer-header-border">
                <div className="px-4 py-2 mb-2">
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Customer Account</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-4"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
