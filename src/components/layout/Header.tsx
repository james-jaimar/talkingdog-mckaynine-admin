
import { Dog } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BranchSelector } from "@/components/branches/BranchSelector";
import { ClassesTabs } from "@/components/classes/ClassesTabs";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, userRole, signOut } = useAuth();
  
  const getUserInitials = () => {
    if (!user) return "U";
    const email = user.email || "";
    return email.charAt(0).toUpperCase();
  };
  
  return (
    <header className="border-b bg-white w-full">
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dog className="h-8 w-8 text-mckaynine-600" />
            <span className="font-bold text-xl text-mckaynine-700">McKaynine</span>
          </div>
          <div className="flex items-center gap-4">
            <BranchSelector />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <span className="text-sm font-medium">{user.email}</span>
                    {userRole && (
                      <span className="text-xs text-gray-500 block capitalize">
                        {userRole}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div className="mt-4 overflow-x-auto">
          <Tabs defaultValue={currentPath === "/" ? "/" : currentPath} className="w-full">
            <TabsList className="w-max min-w-full justify-start">
              <TabsTrigger value="/" asChild>
                <Link to="/" className={cn(currentPath === "/" ? "font-medium" : "")}>
                  Dashboard
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/handlers" asChild>
                <Link to="/handlers" className={cn(currentPath === "/handlers" ? "font-medium" : "")}>
                  Handlers
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/trainers" asChild>
                <Link to="/trainers" className={cn(currentPath === "/trainers" ? "font-medium" : "")}>
                  Trainers
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/classes" asChild>
                <Link to="/classes" className={cn(currentPath === "/classes" ? "font-medium" : "")}>
                  Classes
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/branches" asChild>
                <Link to="/branches" className={cn(currentPath === "/branches" ? "font-medium" : "")}>
                  Branches
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/reports" asChild>
                <Link to="/reports" className={cn(currentPath === "/reports" ? "font-medium" : "")}>
                  Reports
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/settings" asChild>
                <Link to="/settings" className={cn(currentPath === "/settings" ? "font-medium" : "")}>
                  Settings
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Add the class tabs */}
        <ClassesTabs />
      </div>
    </header>
  );
}
