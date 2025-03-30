
import { Header } from "./Header";
import { Dog } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
        <footer className="border-t py-4 px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} McKaynine Training Centre
        </footer>
      </div>
    </div>
  );
}
