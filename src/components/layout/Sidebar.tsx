
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentBranch } from "@/hooks/useCurrentBranch";
import { Loader2 } from "lucide-react";
import { FinancialReportsLink } from "@/components/navigation/FinancialReportsLink";

// Import all the necessary icons
import {
  LayoutDashboard,
  CircleUser,
  Calendar,
  Users,
  DogBowl,
  FileStack,
  Building2,
  User,
  Tag,
  Settings,
  Wrench,
  AlertCircle,
  PiggyBank,
  BarChart3,
} from "lucide-react";

export function Sidebar() {
  const location = useLocation();
  const { userRole, loading } = useAuth();
  const { branch } = useCurrentBranch();
  
  // Check if the user is an admin
  const isAdmin = userRole === "admin";

  return (
    <div className="hidden lg:flex flex-col h-screen w-64 bg-blue-900 text-white overflow-y-auto">
      <div className="py-8 px-6">
        <h1 className="text-2xl font-bold">McKaynine</h1>
        <p className="text-sm text-blue-300 mt-1">Training Admin</p>
        {branch && <p className="text-xs text-blue-300">{branch.name}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="flex-1 py-2">
          <div className="px-3 mb-2">
            <p className="text-xs font-medium text-blue-400 uppercase px-2">Main</p>
          </div>
          <nav className="space-y-1 px-2">
            {/* General links available to trainers and admins */}
            <SidebarLink to="/dashboard" icon={<LayoutDashboard className="h-5 w-5 mr-2" />} label="Dashboard" />
            <SidebarLink to="/classes" icon={<CircleUser className="h-5 w-5 mr-2" />} label="Classes" />
            <SidebarLink to="/schedules" icon={<Calendar className="h-5 w-5 mr-2" />} label="Schedules" />
            <SidebarLink to="/handlers" icon={<Users className="h-5 w-5 mr-2" />} label="Handlers" />
            <SidebarLink to="/clients" icon={<Users className="h-5 w-5 mr-2" />} label="Clients" />
            <SidebarLink to="/dogs" icon={<DogBowl className="h-5 w-5 mr-2" />} label="Dogs" />
            <SidebarLink to="/invoices" icon={<FileStack className="h-5 w-5 mr-2" />} label="Invoices" />
          </nav>

          {/* Admin specific links */}
          {isAdmin && (
            <>
              <div className="px-3 pt-4 mb-2">
                <p className="text-xs font-medium text-blue-400 uppercase px-2">Admin</p>
              </div>
              <nav className="space-y-1 px-2">
                <SidebarLink to="/branches" icon={<Building2 className="h-5 w-5 mr-2" />} label="Branches" />
                <SidebarLink to="/users" icon={<User className="h-5 w-5 mr-2" />} label="Users" />
                <SidebarLink to="/trainers" icon={<User className="h-5 w-5 mr-2" />} label="Trainers" />
                <SidebarLink to="/discounts" icon={<Tag className="h-5 w-5 mr-2" />} label="Discounts" />
                <SidebarLink to="/settings" icon={<Settings className="h-5 w-5 mr-2" />} label="Settings" />
                <SidebarLink to="/maintenance" icon={<Wrench className="h-5 w-5 mr-2" />} label="Maintenance" />
                <SidebarLink to="/unpaid-handlers" icon={<AlertCircle className="h-5 w-5 mr-2" />} label="Unpaid Handlers" />
              </nav>
              
              <div className="px-3 pt-4 mb-2">
                <p className="text-xs font-medium text-blue-400 uppercase px-2">Financial</p>
              </div>
              <nav className="space-y-1 px-2">
                <SidebarLink to="/financial-dashboard" icon={<PiggyBank className="h-5 w-5 mr-2" />} label="Financial Dashboard" />
                <FinancialReportsLink />
              </nav>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function SidebarLink({ to, icon, label }: SidebarLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center text-sm text-gray-200 px-3 py-2 rounded-md transition-colors hover:bg-blue-600",
        isActive && "bg-blue-800"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
