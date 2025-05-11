
import { 
  BarChart3, 
  Calendar, 
  Dog, 
  Home, 
  FileText, 
  Dumbbell, 
  Users, 
  Building2, 
  Settings,
  BarChart4
} from "lucide-react";

// Define a type for navigation items that may have platformAdminOnly property
interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  platformAdminOnly?: boolean;
}

// Admin primary navigation
export const adminPrimaryNavItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home
  },
  {
    name: "Classes",
    path: "/classes",
    icon: Calendar
  },
  {
    name: "Handlers",
    path: "/handlers",
    icon: Dog
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: FileText
  },
  {
    name: "Financial",
    path: "/financial",
    icon: BarChart3
  },
  {
    name: "Reports",
    path: "/reports",
    icon: BarChart4
  },
  {
    name: "Tenant Configuration",
    path: "/tenant-configuration",
    icon: Settings,
    platformAdminOnly: true
  }
];

// Admin secondary navigation
export const adminSecondaryNavItems: NavItem[] = [
  {
    name: "Trainers",
    path: "/trainers",
    icon: Dumbbell
  },
  {
    name: "Users",
    path: "/users",
    icon: Users
  },
  {
    name: "Branches",
    path: "/branches",
    icon: Building2
  }
];

// Trainer primary navigation
export const trainerPrimaryNavItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home
  },
  {
    name: "My Classes",
    path: "/classes",
    icon: Calendar
  },
  {
    name: "Handlers",
    path: "/handlers",
    icon: Dog
  }
];

// Trainer secondary navigation 
export const trainerSecondaryNavItems: NavItem[] = [
  {
    name: "Reports",
    path: "/reports",
    icon: BarChart3
  }
];

// Handler (customer) primary navigation
export const handlerPrimaryNavItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home
  },
  {
    name: "My Classes",
    path: "/customer-classes",
    icon: Calendar
  },
  {
    name: "My Dogs",
    path: "/customer-dogs",
    icon: Dog
  },
  {
    name: "My Invoices",
    path: "/customer-invoices",
    icon: FileText
  }
];

// Handler (customer) secondary navigation
export const handlerSecondaryNavItems: NavItem[] = [
  {
    name: "Messages",
    path: "/customer-messages",
    icon: FileText
  }
];
