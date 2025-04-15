
import { 
  Home, MessageSquare, DollarSign, Clipboard, GitBranch, 
  FileText, Users, User
} from "lucide-react";

export const primaryNavItems = [
  { name: "Dashboard", path: "/customer/dashboard", icon: Home },
];

export const handlerNavItems = [
  { name: "Profile", path: "/customer/profile", icon: null },
  { name: "Messages", path: "/customer/messages", icon: MessageSquare },
  { name: "Invoices", path: "/customer/invoices", icon: DollarSign },
];

export const trainerNavItems = [
  { name: "My Dashboard", path: "/trainer-dashboard", icon: Clipboard },
  { name: "Class Schedules", path: "/class-schedules", icon: null },
  { name: "Handlers", path: "/handlers", icon: null },
  { name: "Invoices", path: "/invoices", icon: DollarSign },
];

export const adminPrimaryNavItems = [
  { name: "Dashboard", path: "/", icon: null },
  { name: "Handlers", path: "/handlers", icon: null },
  { name: "Classes", path: "/classes", icon: null },
  { name: "Class Schedules", path: "/class-schedules", icon: null },
  { name: "Trainers", path: "/trainers", icon: null },
];

export const adminSecondaryNavItems = [
  { name: "Branches", path: "/branches", icon: null },
  { name: "Branch Management", path: "/branch-management", icon: GitBranch },
  { name: "Unpaid Handlers", path: "/unpaid-handlers", icon: null },
  { name: "Forms", path: "/forms", icon: FileText },
  { name: "Invoices", path: "/invoices", icon: DollarSign },
  { name: "User Admin", path: "/user-admin", icon: Users },
];
