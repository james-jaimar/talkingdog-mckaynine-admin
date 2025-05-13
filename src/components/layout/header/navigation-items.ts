
import { Home, Book, Calendar, Users, School, CreditCard, FileText, Settings } from "lucide-react";

export const adminPrimaryNavItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    name: "Classes",
    path: "/admin/classes",
    icon: School,
  },
  {
    name: "Handlers",
    path: "/admin/handlers",
    icon: Users,
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: FileText,
  },
];

export const adminSecondaryNavItems = [
  {
    name: "Schedules",
    path: "/class-schedules",
    icon: Calendar,
  },
  {
    name: "Trainers",
    path: "/trainers",
    icon: School,
  },
  {
    name: "Branches",
    path: "/branches",
    icon: Home,
  },
  {
    name: "Financial Dashboard",
    path: "/financial-dashboard",
    icon: CreditCard,
  },
  {
    name: "Financial Reports",
    path: "/financial-reports",
    icon: Book,
  },
  {
    name: "User Management",
    path: "/user-admin",
    icon: Users,
  },
  {
    name: "Tenant Configuration",
    path: "/admin/tenant-configuration",
    icon: Settings,
    platformAdminOnly: true,
  },
];

export const trainerPrimaryNavItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    name: "My Classes",
    path: "/trainer/classes",
    icon: School,
  },
  {
    name: "Handlers",
    path: "/trainer/handlers",
    icon: Users,
  },
];

export const trainerSecondaryNavItems = [
  {
    name: "Schedules",
    path: "/trainer/schedules",
    icon: Calendar,
  },
  {
    name: "Profile",
    path: "/trainer/profile",
    icon: Users,
  },
  {
    name: "Payments",
    path: "/trainer/payments",
    icon: CreditCard,
  },
];

export const handlerNavItems = [
  {
    name: "Dashboard",
    path: "/customer/dashboard",
    icon: Home,
  },
  {
    name: "My Classes",
    path: "/customer/classes",
    icon: School,
  },
  {
    name: "My Dogs",
    path: "/customer/dogs",
    icon: Users,
  },
  {
    name: "Messages",
    path: "/customer/messages",
    icon: FileText,
  },
  {
    name: "Invoices",
    path: "/customer/invoices",
    icon: CreditCard,
  },
  {
    name: "Profile",
    path: "/customer/profile",
    icon: Users,
  },
];
