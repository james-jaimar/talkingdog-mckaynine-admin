
import { Header } from "./Header";
import { SidebarNav } from "./SidebarNav";
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col min-h-screen w-full bg-gray-100">
        <Header />
        <div className="flex flex-1 w-full overflow-hidden">
          <Sidebar>
            <SidebarContent>
              <SidebarNav />
            </SidebarContent>
          </Sidebar>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
        <footer className="border-t py-4 px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} McKaynine Training Centre
        </footer>
      </div>
    </SidebarProvider>
  );
}
