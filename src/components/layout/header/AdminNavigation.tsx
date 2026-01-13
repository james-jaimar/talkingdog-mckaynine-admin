import { Link } from "react-router-dom";
import { adminPrimaryNavItems, adminSecondaryNavItems } from "./navigation-items";
import { useAuth } from "@/context/auth";
import { Badge } from "@/components/ui/badge";
import { usePendingTaskCount } from "@/hooks/useAllTasks";

interface AdminNavigationProps {
  isMobile: boolean;
  onMobileClose?: () => void;
  showPrimaryOnly?: boolean;
}

export const AdminNavigation = ({ isMobile, onMobileClose, showPrimaryOnly = true }: AdminNavigationProps) => {
  const { isPlatformAdmin } = useAuth();
  const { count: pendingTaskCount } = usePendingTaskCount();
  const items = showPrimaryOnly ? adminPrimaryNavItems : adminSecondaryNavItems;
  
  // Filter out developer-only items for non-platform admins
  const filteredItems = items.filter(item => {
    // Show all items to platform admins
    if (isPlatformAdmin) return true;
    // Hide developer-only items from regular admins
    return !item.developerOnly;
  });
  
  return (
    <nav className={isMobile ? "flex flex-col space-y-2" : "flex space-x-4 flex-nowrap max-w-full"}>
      {isPlatformAdmin && (
        <div className={`${isMobile ? 'mb-2' : 'mr-4'} flex-shrink-0`}>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Platform Admin
          </Badge>
        </div>
      )}
      
      {filteredItems.map(item => (
        <Link 
          key={item.path}
          to={item.path} 
          className={`text-white hover:text-gray-200 px-2 ${isMobile ? 'py-2 flex items-center' : 'py-1 flex items-center flex-shrink-0 whitespace-nowrap'} rounded relative`}
          onClick={onMobileClose}
        >
          {item.icon && (
            <item.icon 
              className={`inline-block h-4 w-4 ${isMobile ? 'mr-2' : 'mr-1'}`} 
            />
          )}
          <span>{item.name}</span>
          {item.name === "Tasks" && pendingTaskCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
};
