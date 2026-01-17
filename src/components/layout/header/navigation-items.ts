
import { Home, Calendar, Users, FileText, BarChart2, UserPlus, Building, Map, AlertCircle, ScanLine, Mail, ClipboardList, Palette } from "lucide-react";

export const adminNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Classes",
    href: "/classes",
  },
  {
    title: "Schedules",
    href: "/schedules",
    developerOnly: true,
  },
  {
    title: "Trainers",
    href: "/trainers",
  },
  {
    title: "Handlers",
    href: "/handlers",
  },
  {
    title: "Invoices",
    href: "/invoices",
  },
  {
    title: "Financial Dashboard",
    href: "/financial-dashboard",
  },
  {
    title: "Financial Reports",
    href: "/financial-reports",
  },
  {
    title: "Users",
    href: "/user-admin",
  },
  {
    title: "Branch Management",
    href: "/branch-management",
    developerOnly: true,
  },
];

// Primary navigation items for admin - prioritized for mobile use
export const adminPrimaryNavItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home,
    mobileShow: true
  },
  {
    name: "Classes",
    path: "/classes",
    icon: Calendar,
    mobileShow: true
  },
  {
    name: "Schedules", 
    path: "/schedules",
    icon: Calendar,
    developerOnly: true,
    mobileShow: false
  },
  {
    name: "Handlers",
    path: "/handlers",
    icon: Users,
    mobileShow: true
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: FileText,
    mobileShow: false
  },
  {
    name: "Email",
    path: "/admin/email",
    icon: Mail,
    mobileShow: false
  }
];

// Secondary navigation items for admin
export const adminSecondaryNavItems = [
  {
    name: "Financial Dashboard",
    path: "/financial-dashboard",
    icon: BarChart2
  },
  {
    name: "Financial Reports",
    path: "/financial-reports",
    icon: BarChart2
  },
  {
    name: "Users",
    path: "/user-admin",
    icon: UserPlus
  },
  {
    name: "Branches",
    path: "/branches",
    icon: Map
  },
  {
    name: "Branch Management",
    path: "/branch-management",
    icon: Building,
    developerOnly: true
  },
  {
    name: "Trainers",
    path: "/trainers",
    icon: Users
  },
  {
    name: "Unpaid Handlers",
    path: "/unpaid-handlers",
    icon: AlertCircle
  },
  {
    name: "Intake Scans",
    path: "/admin/intake-scans",
    icon: ScanLine
  },
  {
    name: "Tasks",
    path: "/admin/tasks",
    icon: ClipboardList
  },
  {
    name: "Email Templates",
    path: "/admin/email-templates",
    icon: Mail
  },
  {
    name: "Template Designer",
    path: "/platform-admin/templates",
    icon: Palette,
    developerOnly: true
  }
];

// Primary navigation items for handlers
export const primaryNavItems = [
  {
    name: "Dashboard",
    path: "/customer/dashboard",
    icon: Home
  },
  {
    name: "My Profile",
    path: "/customer/profile",
    icon: Users
  }
];

// Additional handler navigation items
export const handlerNavItems = [
  {
    name: "My Invoices",
    path: "/customer/invoices",
    icon: FileText
  },
  {
    name: "Messages",
    path: "/customer/messages",
    icon: FileText
  }
];

// Navigation items for trainers - minimal and focused
export const trainerNavItems = [
  {
    name: "Dashboard",
    path: "/trainer/dashboard",
    icon: Home
  },
  {
    name: "My Classes",
    path: "/trainer/classes",
    icon: Calendar
  },
  {
    name: "My Earnings",
    path: "/trainer/earnings",
    icon: FileText
  }
];
