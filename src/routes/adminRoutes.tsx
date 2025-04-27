
import { Routes, Route } from "react-router-dom";
import AdminInvoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceEdit from "@/pages/InvoiceEdit";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import ClassDetail from "@/pages/ClassDetail";
import Handlers from "@/pages/Handlers";
import HandlerDetail from "@/pages/HandlerDetail";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import ClassSessions from "@/pages/ClassSessions";
import Reports from "@/pages/Reports";
import FinancialReports from "@/pages/FinancialReports";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import RequireAdmin from "@/components/auth/RequireAdmin";

// Each route is protected with RequireAdmin component
export const adminRoutes = [
  {
    path: "/admin/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/admin/classes",
    element: <Classes />,
  },
  {
    path: "/admin/classes/:id",
    element: <ClassDetail />,
  },
  {
    path: "/admin/classes/:id/sessions",
    element: <ClassSessions />,
  },
  {
    path: "/admin/handlers",
    element: <Handlers />,
  },
  {
    path: "/admin/handlers/:id",
    element: <HandlerDetail />,
  },
  {
    path: "/admin/messages",
    element: <Messages />,
  },
  {
    path: "/admin/settings",
    element: <Settings />,
  },
  {
    path: "/admin/reports",
    element: <Reports />,
  },
  {
    path: "/admin/financial-reports",
    element: <FinancialReports />,
  },
  {
    path: "/invoices",
    element: <AdminInvoices />,
  },
  {
    path: "/invoices/:id",
    element: <InvoiceDetail />,
  },
  {
    path: "/invoices/:id/edit",
    element: <InvoiceEdit />,
  },
];
