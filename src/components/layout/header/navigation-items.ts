
import { Home, Calendar, Users, FileText, BarChart2, UserPlus, Building, Map, AlertCircle, ScanLine, Mail, ClipboardList, Palette, MessageSquare, Settings } from "lucide-react";

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
// Dashboard removed - logo click navigates to dashboard
export const adminPrimaryNavItems = [
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
  },
  {
    name: "Trainer Notes",
    path: "/admin/trainer-notes",
    icon: MessageSquare,
    mobileShow: false
  }
];

// Secondary navigation items for admin - consolidated into fewer items
export const adminSecondaryNavItems = [
  {
    name: "Financial",
    path: "/financial-reports",
    icon: BarChart2
  },
  {
    name: "Admin",
    path: "/admin/settings",
    icon: Settings
  },
  {
    name: "Branch Management",
    path: "/branch-management",
    icon: Building,
    developerOnly: true
  },
  {
    name: "Assistants",
    path: "/assistants",
    icon: Users
  },
  {
    name: "Tasks",
    path: "/admin/tasks",
    icon: ClipboardList
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
