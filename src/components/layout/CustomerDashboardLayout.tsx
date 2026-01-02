import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerHeader } from "@/components/layout/CustomerHeader";
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

  // Loading state with improved design
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-customer-bg">
        <div className="w-12 h-12 rounded-xl bg-customer-accent/20 flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-customer-accent border-t-transparent"></div>
        </div>
        <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-customer-bg">
      {/* Customer Header */}
      <CustomerHeader />
      
      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 border-t border-customer-header-border bg-customer-header-bg">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} McKaynine Training Centre. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
