
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  Calendar, 
  Book, 
  Receipt, 
  Dog, 
  BookOpenCheck, 
  FileText, 
  MessageCircle,
  Settings,
  Building2,
  User
} from "lucide-react";
import { useAuth } from "@/context/auth";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const { pathname } = useLocation();
  const { user, isTrainer, isAdmin } = useAuth();
  
  // Store links for the sidebar - can be filtered based on user role
  const links = [
    { href: "/", label: "Home", icon: Home, roles: ["user", "trainer", "admin"] },
    { href: "/clients", label: "Clients", icon: Users, roles: ["trainer", "admin"] },
    { href: "/dogs", label: "Dogs", icon: Dog, roles: ["trainer", "admin"] },
    { href: "/handlers", label: "Handlers", icon: User, roles: ["trainer", "admin"] },
    { href: "/classes", label: "Classes", icon: Book, roles: ["trainer", "admin"] },
    { href: "/schedules", label: "Schedules", icon: Calendar, roles: ["trainer", "admin"] },
    { href: "/invoices/list", label: "Invoices", icon: Receipt, roles: ["trainer", "admin"] }, // Updated path
    { href: "/trainers", label: "Trainers", icon: BookOpenCheck, roles: ["admin"] },
    { href: "/forms", label: "Forms", icon: FileText, roles: ["trainer", "admin"] },
    { href: "/messages", label: "Messages", icon: MessageCircle, roles: ["trainer", "admin"] },
    { href: "/branch-management", label: "Branches", icon: Building2, roles: ["admin"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["trainer", "admin"] },
  ];

  // Filter links based on user role
  const filteredLinks = links.filter(link => {
    if (!user) return false;
    
    if (isAdmin) return link.roles.includes("admin");
    if (isTrainer) return link.roles.includes("trainer");
    
    return link.roles.includes("user");
  });

  return (
    <nav
      className={cn("flex flex-col space-y-1", className)}
      {...props}
    >
      {filteredLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        
        return (
          <Link
            key={link.href}
            to={link.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-mckaynine-700 text-white hover:bg-mckaynine-800 hover:text-white"
                : "text-gray-200 hover:bg-mckaynine-700 hover:text-white",
              "justify-start"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
