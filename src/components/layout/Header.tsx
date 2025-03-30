
import { Dog } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  return (
    <header className="border-b bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dog className="h-8 w-8 text-mckaynine-600" />
            <span className="font-bold text-xl text-mckaynine-700">McKaynine</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, Admin</span>
          </div>
        </div>
        
        <div className="mt-4">
          <Tabs defaultValue={currentPath === "/" ? "/" : currentPath}>
            <TabsList className="w-full justify-start">
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
      </div>
    </header>
  );
}
