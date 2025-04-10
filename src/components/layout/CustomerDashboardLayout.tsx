
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/auth";

export function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/customer-login');
    }
  }, [user, isLoading, navigate]);

  // Hidden while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Content Area */}
        <main className="flex-1 w-full overflow-x-hidden">
          <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
