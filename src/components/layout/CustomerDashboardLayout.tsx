
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { 
  Bell, 
  Calendar, 
  Dog, 
  FileText, 
  LogOut,
  Menu, 
  MessageSquare, 
  User, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function CustomerDashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account."
        });
        navigate("/customer/login");
      } else {
        toast({
          title: "Logout failed",
          description: result.error || "An error occurred while logging out.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/customer/dashboard", icon: <Dog className="w-5 h-5 mr-2" /> },
    { name: "My Profile", href: "/customer/profile", icon: <User className="w-5 h-5 mr-2" /> },
    { name: "My Classes", href: "/customer/classes", icon: <Calendar className="w-5 h-5 mr-2" /> },
    { name: "Messages", href: "/customer/messages", icon: <MessageSquare className="w-5 h-5 mr-2" /> },
    { name: "Forms", href: "/customer/forms", icon: <FileText className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-mckaynine-600 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Remove the logo image per request */}
              <div className="flex-shrink-0">
                <Link to="/customer/dashboard">
                  <span className="text-lg font-semibold text-white">
                    McKaynine Portal
                  </span>
                </Link>
              </div>
              
              {/* Desktop Navigation - Fixed spacing and layout */}
              <div className="hidden md:ml-6 md:flex md:space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium flex items-center whitespace-nowrap"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[80%] sm:w-[300px]">
                  <div className="py-4 flex flex-col h-full">
                    <div className="px-4 flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-mckaynine-700">
                          McKaynine Portal
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <nav className="mt-5 flex-1 px-2 space-y-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-gray-100"
                          onClick={() => setSidebarOpen(false)}
                        >
                          {item.icon}
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    <div className="mt-auto px-3 pb-3">
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* User dropdown and logout button */}
            <div className="hidden md:flex md:items-center">
              <div className="flex items-center">
                <div className="text-sm text-white mr-4">
                  <User className="inline-block mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  size="sm"
                  className="text-white hover:bg-red-700"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Added width constraint */}
      <main className="flex-1">
        <div className="w-[80%] mx-auto">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} McKaynine Training Centre. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
