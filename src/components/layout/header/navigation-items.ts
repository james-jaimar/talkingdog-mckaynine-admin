
import { 
  Home, MessageSquare, DollarSign, Clipboard, GitBranch, 
  FileText, Users, User
} from "lucide-react";

export const primaryNavItems = [
  { name: "Dashboard", path: "/customer/dashboard", icon: <Home className="inline-block mr-1 h-4 w-4" /> },
];

export const handlerNavItems = [
  { name: "Profile", path: "/customer/profile", icon: null },
  { name: "Messages", path: "/customer/messages", icon: <MessageSquare className="inline-block mr-1 h-4 w-4" /> },
  { name: "Invoices", path: "/customer/invoices", icon: <DollarSign className="inline-block mr-1 h-4 w-4" /> },
];

export const trainerNavItems = [
  { name: "My Dashboard", path: "/trainer-dashboard", icon: <Clipboard className="inline-block mr-1 h-4 w-4" /> },
  { name: "Class Schedules", path: "/class-schedules", icon: null },
  { name: "Handlers", path: "/handlers", icon: null },
  { name: "Invoices", path: "/invoices", icon: <DollarSign className="inline-block mr-1 h-4 w-4" /> },
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
  { name: "Branch Management", path: "/branch-management", icon: <GitBranch className="inline-block mr-1 h-4 w-4" /> },
  { name: "Unpaid Handlers", path: "/unpaid-handlers", icon: null },
  { name: "Forms", path: "/forms", icon: <FileText className="inline-block mr-1 h-4 w-4" /> },
  { name: "Invoices", path: "/invoices", icon: <DollarSign className="inline-block mr-1 h-4 w-4" /> },
  { name: "User Admin", path: "/user-admin", icon: <Users className="inline-block mr-1 h-4 w-4" /> },
];
