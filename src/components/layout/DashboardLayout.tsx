
import { Header } from "./Header";
import { Dog } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 w-full overflow-x-hidden">
          <div className="w-full max-w-[100vw] px-4 md:px-6">
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
