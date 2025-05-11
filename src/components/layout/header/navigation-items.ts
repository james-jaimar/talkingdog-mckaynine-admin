
import { 
  BarChart3, 
  Calendar, 
  Dog, 
  FileText, 
  Home, 
  Layers, 
  Settings, 
  Users,
  Building2,
  Store,
  UserCog
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  platformAdminOnly?: boolean;
}

export const adminPrimaryNavItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home
  },
  {
    name: "Classes",
    path: "/classes",
    icon: Layers
  },
  {
    name: "Handlers",
    path: "/handlers",
    icon: Users
  },
  {
    name: "Reports",
    path: "/financial-reports",
    icon: BarChart3
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: FileText
  }
];

export const adminSecondaryNavItems: NavItem[] = [
  {
    name: "Class Schedules",
    path: "/class-schedules",
    icon: Calendar
  },
  {
    name: "Trainers",
    path: "/trainers",
    icon: Users
  },
  {
    name: "Users",
    path: "/user-admin",
    icon: UserCog
  },
  {
    name: "Branches",
    path: "/branches",
    icon: Building2,
  },
  {
    name: "Tenant Config",
    path: "/tenant-config",
    icon: Settings,
    platformAdminOnly: true
  }
];

export const trainerPrimaryNavItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/trainer-dashboard",
    icon: Home
  },
  {
    name: "Classes",
    path: "/classes",
    icon: Layers
  },
  {
    name: "Handlers",
    path: "/handlers",
    icon: Users
  }
];

export const trainerSecondaryNavItems: NavItem[] = [
  {
    name: "Class Schedules",
    path: "/class-schedules",
    icon: Calendar
  },
  {
    name: "Forms",
    path: "/forms",
    icon: FileText
  }
];

export const handlerPrimaryNavItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/customer-dashboard",
    icon: Home
  },
  {
    name: "My Classes",
    path: "/customer-classes",
    icon: Layers
  },
  {
    name: "My Dogs",
    path: "/customer-dogs",
    icon: Dog
  },
  {
    name: "Messages",
    path: "/customer-messages",
    icon: FileText
  },
  {
    name: "Invoices",
    path: "/customer-invoices",
    icon: FileText
  }
];

export const handlerSecondaryNavItems: NavItem[] = [
  {
    name: "Store",
    path: "/store",
    icon: Store
  },
  {
    name: "Profile",
    path: "/customer-profile",
    icon: Settings
  }
];
