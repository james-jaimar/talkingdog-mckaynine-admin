
import AdminInvoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceEdit from "@/pages/InvoiceEdit";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import ClassDetail from "@/pages/ClassDetail";
import ClassHandlers from "@/pages/ClassHandlers";
import ClassSchedules from "@/pages/ClassSchedules";
import Handlers from "@/pages/Handlers";
import HandlerDetail from "@/pages/HandlerDetail";
import FinancialReports from "@/pages/FinancialReports";
import IntakeScans from "@/pages/admin/IntakeScans";
import GoogleFormLog from "@/pages/admin/GoogleFormLog";
import Tasks from "@/pages/admin/Tasks";
import EmailTemplates from "@/pages/admin/EmailTemplates";
import Email from "@/pages/admin/Email";
import TrainerNotes from "@/pages/admin/TrainerNotes";
import Settings from "@/pages/admin/Settings";
import Assistants from "@/pages/Assistants";

// Each route is protected with RequireAdmin component
export const adminRoutes = [
  {
    path: "/admin/dashboard",
    element: <Dashboard />,
  },
  // Root-level admin routes (used by navigation)
  {
    path: "/handlers",
    element: <Handlers />,
  },
  {
    path: "/handlers/:id",
    element: <HandlerDetail />,
  },
  {
    path: "/classes",
    element: <Classes />,
  },
  {
    path: "/classes/:id",
    element: <ClassDetail />,
  },
  {
    path: "/classes/:id/schedules",
    element: <ClassSchedules />,
  },
  {
    path: "/class/:id/handlers",
    element: <ClassHandlers />,
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
    path: "/admin/classes/:id/schedules",
    element: <ClassSchedules />,
  },
  {
    path: "/admin/class/:id/handlers",
    element: <ClassHandlers />,
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
    path: "/admin/intake-scans",
    element: <IntakeScans />,
  },
  {
    path: "/admin/google-form-log",
    element: <GoogleFormLog />,
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
    path: "/admin/email",
    element: <Email />,
  },
  {
    path: "/admin/trainer-notes",
    element: <TrainerNotes />,
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
  // Consolidated financial hub
  {
    path: "/financial-reports",
    element: <FinancialReports />,
  },
  // Consolidated admin hub
  {
    path: "/admin/settings",
    element: <Settings />,
  },
  // Consolidated assistants hub (includes Sessions and Schedule as tabs)
  {
    path: "/assistants",
    element: <Assistants />,
  },
];
