
import { Header } from "./Header";
import { Dog } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-6 w-full max-w-full overflow-x-hidden">
          <div className="container mx-auto max-w-full px-0">
            {children}
          </div>
        </main>
        <footer className="border-t py-4 px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} McKaynine Training Centre
        </footer>
      </div>
    </div>
  );
}
