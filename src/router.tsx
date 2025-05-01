
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import LoginPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import ClassesPage from "./pages/Classes";
import SchedulesPage from "./pages/ClassSchedules";
import HandlersPage from "./pages/Handlers";
import BranchPage from "./pages/Branches";
import UserPage from "./pages/UserAdmin";
import InvoicesPage from "./pages/Invoices";
import InvoiceDetailsPage from "./pages/InvoiceDetail";
import NotFoundPage from "./pages/NotFound";
import FinancialDashboardPage from "./pages/FinancialDashboard";
import FinancialReportsPage from "./pages/FinancialReports";
import TrainersPage from "./pages/Trainers";
import UnpaidHandlersPage from "./pages/UnpaidHandlers";

// Import the route collections
import { adminRoutes } from "./routes/adminRoutes";
import { trainerRoutes } from "./routes/trainerRoutes";

// Define the base routes that are available
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute requiredRole="trainer"><DashboardPage /></ProtectedRoute>,
  },
  {
    path: "/classes",
    element: <ProtectedRoute requiredRole="trainer"><ClassesPage /></ProtectedRoute>
  },
  {
    path: "/schedules",
    element: <ProtectedRoute requiredRole="trainer"><SchedulesPage /></ProtectedRoute>
  },
  {
    path: "/handlers",
    element: <ProtectedRoute requiredRole="trainer"><HandlersPage /></ProtectedRoute>
  },
  {
    path: "/clients",
    element: <ProtectedRoute requiredRole="trainer">
      {/* We'll use a component that uses the useClientsData hook */}
      <ClientsComponent />
    </ProtectedRoute>
  },
  {
    path: "/invoices",
    element: <ProtectedRoute requiredRole="trainer"><InvoicesPage /></ProtectedRoute>
  },
  {
    path: "/invoices/:invoiceId",
    element: <ProtectedRoute requiredRole="trainer"><InvoiceDetailsPage /></ProtectedRoute>
  },
  {
    path: "/branches",
    element: <RequireAdmin><BranchPage /></RequireAdmin>
  },
  {
    path: "/users",
    element: <RequireAdmin><UserPage /></RequireAdmin>
  },
  {
    path: "/trainers",
    element: <RequireAdmin><TrainersPage /></RequireAdmin>
  },
  {
    path: "/unpaid-handlers",
    element: <RequireAdmin><UnpaidHandlersPage /></RequireAdmin>
  },
  {
    path: "/financial-dashboard",
    element: <RequireAdmin><FinancialDashboardPage /></RequireAdmin>
  },
  {
    path: "/financial-reports",
    element: <RequireAdmin><FinancialReportsPage /></RequireAdmin>
  },
  {
    path: "/client/:id",
    element: <ProtectedRoute requiredRole="trainer">
      <ClientDetailComponent />
    </ProtectedRoute>
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);

// Create a new ClientsComponent that uses the useClientsData hook
function ClientsComponent() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      <ClientsList />
    </div>
  );
}

// Create a ClientsList component that fetches and displays clients
function ClientsList() {
  const { clients, isLoading, error } = useClientsData();
  
  if (isLoading) {
    return <div className="flex justify-center py-12"><p>Loading clients...</p></div>;
  }
  
  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <p className="text-red-700">Error loading clients: {error.message}</p>
    </div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients?.map((client) => (
            <tr key={client.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {client.first_name} {client.last_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.phone || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Link to={`/client/${client.id}`} className="text-blue-600 hover:text-blue-900">
                  View Details
                </Link>
              </td>
            </tr>
          ))}
          {clients?.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                No clients found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Create a ClientDetailComponent
function ClientDetailComponent() {
  const { id } = useParams();
  const { useClientById } = useClientsData();
  const { data: client, isLoading, error } = useClientById(id);
  
  if (isLoading) {
    return <div className="container py-8">
      <div className="flex justify-center py-12">
        <p>Loading client details...</p>
      </div>
    </div>;
  }
  
  if (error) {
    return <div className="container py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <p className="text-red-700">Error loading client: {error.message}</p>
      </div>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/clients">Back to Clients</Link>
      </Button>
    </div>;
  }
  
  if (!client) {
    return <div className="container py-8">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4">
        <p className="text-amber-700">Client not found</p>
      </div>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/clients">Back to Clients</Link>
      </Button>
    </div>;
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <Button asChild variant="outline">
          <Link to="/clients">Back to Clients</Link>
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{client.first_name} {client.last_name}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p>{client.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p>{client.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p>{client.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Notes</p>
            <p>{client.notes || '-'}</p>
          </div>
        </div>
      </div>
      
      {client.dogs && client.dogs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Dogs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {client.dogs.map(dog => (
              <div key={dog.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium">{dog.name}</h3>
                <p className="text-sm text-gray-500">Breed: {dog.breed}</p>
                {dog.age && <p className="text-sm text-gray-500">Age: {dog.age} years</p>}
                {dog.weight && <p className="text-sm text-gray-500">Weight: {dog.weight} lbs</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Necessary imports that were missing
import { useParams, Link } from "react-router-dom";
import { useClientsData } from "./hooks/useClientsData";
import { Button } from "@/components/ui/button";

export default router;
