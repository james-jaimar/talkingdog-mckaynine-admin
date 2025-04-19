
import { createBrowserRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import ClassDetail from "@/pages/ClassDetail";
import BranchManagement from "@/pages/BranchManagement";
import Classes from "@/pages/Classes";
import Trainers from "@/pages/Trainers";
import Handlers from "@/pages/Handlers";
import HandlerDetail from "@/pages/HandlerDetail";
import ClassSchedules from "@/pages/ClassSchedules";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceEdit from "@/pages/InvoiceEdit";
import UserAdmin from "@/pages/UserAdmin";
import FinancialDashboard from "@/pages/FinancialDashboard";
import FinancialReports from "@/pages/FinancialReports";

export const adminRoutes = [
  {
    path: "/dashboard",
    element: <Dashboard />
  },
  {
    path: "/classes",
    element: <Classes />
  },
  {
    path: "/classes/:classId",
    element: <ClassDetail />
  },
  {
    path: "/schedules",
    element: <ClassSchedules />
  },
  {
    path: "/trainers",
    element: <Trainers />
  },
  {
    path: "/branch-management",
    element: <BranchManagement />
  },
  {
    path: "/handlers",
    element: <Handlers />
  },
  {
    path: "/handlers/:handlerId",
    element: <HandlerDetail />
  },
  {
    path: "/invoices",
    element: <Invoices />
  },
  {
    path: "/invoices/:invoiceId",
    element: <InvoiceDetail />
  },
  {
    path: "/invoices/:invoiceId/edit",
    element: <InvoiceEdit />
  },
  {
    path: "/user-admin",
    element: <UserAdmin />
  },
  {
    path: "/financial-dashboard",
    element: <FinancialDashboard />
  },
  {
    path: "/financial-reports",
    element: <FinancialReports />
  }
];
