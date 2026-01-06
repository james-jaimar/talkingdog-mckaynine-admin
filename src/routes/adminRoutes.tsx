
import { Routes, Route } from "react-router-dom";
import AdminInvoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceEdit from "@/pages/InvoiceEdit";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import ClassDetail from "@/pages/ClassDetail";
import Handlers from "@/pages/Handlers";
import HandlerDetail from "@/pages/HandlerDetail";
import FinancialReports from "@/pages/FinancialReports";
import FinancialDashboard from "@/pages/FinancialDashboard";
import IntakeScans from "@/pages/admin/IntakeScans";
import Tasks from "@/pages/admin/Tasks";
import EmailTemplates from "@/pages/admin/EmailTemplates";
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
    path: "/admin/handlers",
    element: <Handlers />,
  },
  {
    path: "/admin/handlers/:id",
    element: <HandlerDetail />,
  },
  {
    path: "/admin/financial-reports",
    element: <FinancialReports />,
  },
  {
    path: "/admin/financial-dashboard",
    element: <FinancialDashboard />,
  },
  {
    path: "/admin/intake-scans",
    element: <IntakeScans />,
  },
  {
    path: "/admin/tasks",
    element: <Tasks />,
  },
  {
    path: "/admin/email-templates",
    element: <EmailTemplates />,
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
  {
    path: "/financial-dashboard",
    element: <FinancialDashboard />,
  },
  {
    path: "/financial-reports",
    element: <FinancialReports />,
  },
];
