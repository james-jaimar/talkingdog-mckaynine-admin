
import React from 'react';
import { Header } from "@/components/layout/Header";

export function DashboardLayout({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Content Area */}
        <main className="flex-1 w-full overflow-x-hidden">
          <div className={fullWidth ? "w-full px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6" : "container mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
