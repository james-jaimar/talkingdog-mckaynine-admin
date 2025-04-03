
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

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
    { name: "Dashboard", href: "/customer/dashboard", icon: <Dog className="w-5 h-5 mr-3" /> },
    { name: "My Profile", href: "/customer/profile", icon: <User className="w-5 h-5 mr-3" /> },
    { name: "My Classes", href: "/customer/classes", icon: <Calendar className="w-5 h-5 mr-3" /> },
    { name: "Messages", href: "/customer/messages", icon: <MessageSquare className="w-5 h-5 mr-3" /> },
    { name: "Forms", href: "/customer/forms", icon: <FileText className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img
                  src="/lovable-uploads/02f80db5-fcad-4633-862b-5c42a27cf712.png"
                  alt="McKaynine Logo"
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-lg font-semibold text-mckaynine-700 hidden md:block">
                  McKaynine Portal
                </span>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                  <div className="py-4 flex flex-col h-full">
                    <div className="px-4 flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <img
                          src="/lovable-uploads/02f80db5-fcad-4633-862b-5c42a27cf712.png"
                          alt="McKaynine Logo"
                          className="h-8 w-auto"
                        />
                        <span className="ml-2 text-lg font-semibold text-mckaynine-700">
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
                        variant="outline"
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
            
            {/* Desktop nav */}
            <div className="hidden md:flex md:items-center">
              <Button variant="ghost" size="icon" className="mx-2">
                <Bell className="h-5 w-5" />
              </Button>
              
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="ml-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 pb-4 bg-white overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
