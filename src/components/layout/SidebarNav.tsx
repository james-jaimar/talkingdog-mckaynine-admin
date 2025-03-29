
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Dog, Calendar, MapPin, Home, BarChart2, Settings, Users
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-mckaynine-700 text-white" 
          : "text-gray-700 hover:bg-mckaynine-100"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export function SidebarNav() {
  return (
    <div className="space-y-1">
      <NavItem to="/" icon={Home} label="Dashboard" />
      <NavItem to="/handlers" icon={Users} label="Handlers" />
      <NavItem to="/classes" icon={Calendar} label="Classes" />
      <NavItem to="/branches" icon={MapPin} label="Branches" />
      <NavItem to="/reports" icon={BarChart2} label="Reports" />
      <NavItem to="/settings" icon={Settings} label="Settings" />
    </div>
  );
}
