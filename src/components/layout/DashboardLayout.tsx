
import { SidebarNav } from "./SidebarNav";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white border-r">
        <div className="flex items-center h-16 px-6 border-b">
          <Dog className="h-8 w-8 text-mckaynine-600" />
          <span className="font-bold text-xl ml-2 text-mckaynine-700">McKaynine</span>
        </div>
        <div className="flex-1 py-4 px-3">
          <SidebarNav />
        </div>
      </div>
      
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
