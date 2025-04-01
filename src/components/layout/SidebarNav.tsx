
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Calendar, MapPin, Home, BarChart2, DollarSign, Users, UserRound, Clock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  requiresAdmin?: boolean;
}

const NavItem = ({ to, icon: Icon, label, requiresAdmin = false }: NavItemProps) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  // Don't render admin-only items for non-admin users
  if (requiresAdmin && !isAdmin) {
    return null;
  }
  
  // Check if the current path matches this nav item
  const isActive = location.pathname === to || 
                  (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-mckaynine-700 text-white font-medium" 
          : "text-gray-700 hover:bg-mckaynine-100 hover:text-mckaynine-700"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export function SidebarNav() {
  const { isAdmin } = useAuth();
  
  return (
    <div className="space-y-1 px-2 py-2">
      <NavItem to="/" icon={Home} label="Dashboard" />
      <NavItem to="/handlers" icon={Users} label="Handlers" />
      <NavItem to="/classes" icon={Calendar} label="Classes" />
      <NavItem to="/class-schedules" icon={Clock} label="Class Schedules" />
      <NavItem to="/trainers" icon={UserRound} label="Trainers" />
      <NavItem to="/branches" icon={MapPin} label="Branches" requiresAdmin={true} />
      <NavItem to="/unpaid-handlers" icon={DollarSign} label="Unpaid Handlers" requiresAdmin={true} />
      {isAdmin && <NavItem to="/reports" icon={BarChart2} label="Reports" />}
    </div>
  );
}
