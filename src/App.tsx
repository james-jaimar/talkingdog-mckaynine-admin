import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Handlers from "./pages/Handlers";
import AddHandler from "./pages/AddHandler";
import EditHandler from "./pages/EditHandler";
import Classes from "./pages/Classes";
import AddClass from "./pages/AddClass";
import EditClass from "./pages/EditClass";
import Bookings from "./pages/Bookings";
import AddBooking from "./pages/AddBooking";
import EditBooking from "./pages/EditBooking";
import Invoices from "./pages/Invoices";
import InvoiceDetails from "./pages/InvoiceDetails";
import FinancialReports from "./pages/FinancialReports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerBookings from "./pages/CustomerBookings";
import CustomerInvoices from "./pages/CustomerInvoices";
import CustomerInvoiceDetails from "./pages/CustomerInvoiceDetails";
import { BranchProvider } from "./context/BranchContext";
import { TermProvider } from "./context/TermContext";
import ProblematicInvoicesPage from "./pages/admin/ProblematicInvoicesPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/handlers",
    element: (
      <RequireAuth>
        <Handlers />
      </RequireAuth>
    ),
  },
  {
    path: "/handlers/add",
    element: (
      <RequireAuth>
        <AddHandler />
      </RequireAuth>
    ),
  },
  {
    path: "/handlers/edit/:id",
    element: (
      <RequireAuth>
        <EditHandler />
      </RequireAuth>
    ),
  },
  {
    path: "/classes",
    element: (
      <RequireAuth>
        <Classes />
      </RequireAuth>
    ),
  },
  {
    path: "/classes/add",
    element: (
      <RequireAuth>
        <AddClass />
      </RequireAuth>
    ),
  },
  {
    path: "/classes/edit/:id",
    element: (
      <RequireAuth>
        <EditClass />
      </RequireAuth>
    ),
  },
  {
    path: "/bookings",
    element: (
      <RequireAuth>
        <Bookings />
      </RequireAuth>
    ),
  },
  {
    path: "/bookings/add",
    element: (
      <RequireAuth>
        <AddBooking />
      </RequireAuth>
    ),
  },
  {
    path: "/bookings/edit/:id",
    element: (
      <RequireAuth>
        <EditBooking />
      </RequireAuth>
    ),
  },
  {
    path: "/invoices",
    element: (
      <RequireAuth>
        <Invoices />
      </RequireAuth>
    ),
  },
  {
    path: "/invoices/:id",
    element: (
      <RequireAuth>
        <InvoiceDetails />
      </RequireAuth>
    ),
  },
  {
    path: "/financial-reports",
    element: (
      <RequireAuth>
        <FinancialReports />
      </RequireAuth>
    ),
  },
  {
    path: "/settings",
    element: (
      <RequireAuth>
        <Settings />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/dashboard",
    element: (
      <RequireAuth customerOnly={true}>
        <CustomerDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/bookings",
    element: (
      <RequireAuth customerOnly={true}>
        <CustomerBookings />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/invoices",
    element: (
      <RequireAuth customerOnly={true}>
        <CustomerInvoices />
      </RequireAuth>
    ),
  },
  {
    path: "/customer/invoices/:id",
    element: (
      <RequireAuth customerOnly={true}>
        <CustomerInvoiceDetails />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/problematic-invoices",
    element: <ProblematicInvoicesPage />
  },
]);

function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <TermProvider>
          <RouterProvider router={router} />
        </TermProvider>
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
