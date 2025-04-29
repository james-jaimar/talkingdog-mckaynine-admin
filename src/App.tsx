import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ui/theme-provider';
import Dashboard from './pages/Dashboard';
import Handlers from './pages/Handlers';
import Classes from './pages/Classes';
import Clients from './pages/Clients';
import Bookings from './pages/Bookings';
import FinancialReports from './pages/FinancialReports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { useUser } from './hooks/useUser';
import { UserProvider } from './context/UserContext';
import { Toaster } from "@/components/ui/toaster"
import ClassDetail from './pages/ClassDetail';
import HandlerDetail from './pages/HandlerDetail';
import ClientDetail from './pages/ClientDetail';
import BookingDetail from './pages/BookingDetail';
import CreateClass from './pages/CreateClass';
import EditClass from './pages/EditClass';
import CreateHandler from './pages/CreateHandler';
import EditHandler from './pages/EditHandler';
import CreateClient from './pages/CreateClient';
import EditClient from './pages/EditClient';
import CreateBooking from './pages/CreateBooking';
import EditBooking from './pages/EditBooking';
import { BranchProvider } from './context/BranchContext';
import { TermProvider } from './context/TermContext';
import { SignalRProvider } from './context/SignalRContext';
import { LocationProvider } from './context/LocationContext';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import EditInvoice from './pages/EditInvoice';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerClasses from './pages/customer/CustomerClasses';
import CustomerBookings from './pages/customer/CustomerBookings';
import CustomerInvoiceDetail from './pages/customer/CustomerInvoiceDetail';
import CustomerInvoices from './pages/customer/CustomerInvoices';
import UnpaidHandlers from './pages/UnpaidHandlers';
import { useLocationData } from './hooks/useLocationData';
import { useSignalRConnection } from './hooks/useSignalRConnection';

function App() {
  const queryClient = new QueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const { initializeLocations, isLoading: isLocationLoading } = useLocationData();
  const { initializeSignalR, isLoading: isSignalRLoading } = useSignalRConnection();
  const [isEverythingLoading, setIsEverythingLoading] = useState(true);

  useEffect(() => {
    const checkLoading = () => {
      if (!isUserLoading && !isLocationLoading && !isSignalRLoading) {
        setIsEverythingLoading(false);
      }
    };

    checkLoading();
  }, [isUserLoading, isLocationLoading, isSignalRLoading]);

  useEffect(() => {
    if (user) {
      initializeLocations();
      initializeSignalR();
    }
  }, [user, initializeLocations, initializeSignalR]);

  if (isEverythingLoading) {
    return <div>Loading...</div>;
  }

  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    return user ? <>{children}</> : <Navigate to="/login" />;
  };

  const CustomerPrivateRoute = ({ children }: { children: React.ReactNode }) => {
    return user ? <>{children}</> : <Navigate to="/login" />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="mckaynine-theme">
        <BranchProvider>
          <TermProvider>
            <SignalRProvider>
              <LocationProvider>
                <UserProvider>
                  <Toaster richColors closeButton />
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/handlers" element={<PrivateRoute><Handlers /></PrivateRoute>} />
                    <Route path="/handlers/create" element={<PrivateRoute><CreateHandler /></PrivateRoute>} />
                    <Route path="/handlers/:id" element={<PrivateRoute><HandlerDetail /></PrivateRoute>} />
                    <Route path="/handlers/:id/edit" element={<PrivateRoute><EditHandler /></PrivateRoute>} />

                    <Route path="/classes" element={<PrivateRoute><Classes /></PrivateRoute>} />
                    <Route path="/class/create" element={<PrivateRoute><CreateClass /></PrivateRoute>} />
                    <Route path="/class/:id" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
                    <Route path="/class/:id/edit" element={<PrivateRoute><EditClass /></PrivateRoute>} />

                    <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
                    <Route path="/clients/create" element={<PrivateRoute><CreateClient /></PrivateRoute>} />
                    <Route path="/clients/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
                    <Route path="/clients/:id/edit" element={<PrivateRoute><EditClient /></PrivateRoute>} />

                    <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
                    <Route path="/bookings/create" element={<PrivateRoute><CreateBooking /></PrivateRoute>} />
                    <Route path="/bookings/:id" element={<PrivateRoute><BookingDetail /></PrivateRoute>} />
                    <Route path="/bookings/:id/edit" element={<PrivateRoute><EditBooking /></PrivateRoute>} />

                    <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
                    <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetail /></PrivateRoute>} />
                    <Route path="/invoices/:id/edit" element={<PrivateRoute><EditInvoice /></PrivateRoute>} />

                    <Route path="/financial-reports" element={<PrivateRoute><FinancialReports /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                    <Route path="/unpaid-handlers" element={<PrivateRoute><UnpaidHandlers /></PrivateRoute>} />

                    {/* Customer Routes */}
                    <Route path="/customer/dashboard" element={<CustomerPrivateRoute><CustomerDashboard /></CustomerPrivateRoute>} />
                    <Route path="/customer/classes" element={<CustomerPrivateRoute><CustomerClasses /></CustomerPrivateRoute>} />
                    <Route path="/customer/bookings" element={<CustomerPrivateRoute><CustomerBookings /></CustomerPrivateRoute>} />
                    <Route path="/customer/invoices" element={<CustomerPrivateRoute><CustomerInvoices /></CustomerPrivateRoute>} />
                    <Route path="/customer/invoices/:id" element={<CustomerPrivateRoute><CustomerInvoiceDetail /></CustomerPrivateRoute>} />
                  </Routes>
                </UserProvider>
              </LocationProvider>
            </SignalRProvider>
          </TermProvider>
        </BranchProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
