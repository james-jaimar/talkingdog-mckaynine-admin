
import { Link } from "react-router-dom";
import { adminPrimaryNavItems, adminSecondaryNavItems } from "./navigation-items";
import { useAuth } from "@/context/auth";
import { Badge } from "@/components/ui/badge";

interface AdminNavigationProps {
  isMobile: boolean;
  onMobileClose?: () => void;
  showPrimaryOnly?: boolean;
}

// Fix the admin navigation items type to include platformAdminOnly
interface AdminNavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  platformAdminOnly?: boolean;
}

export const AdminNavigation = ({ isMobile, onMobileClose, showPrimaryOnly = true }: AdminNavigationProps) => {
  const { isPlatformAdmin } = useAuth();
  const items = showPrimaryOnly ? adminPrimaryNavItems : adminSecondaryNavItems;
  
  // Filter items that are platformAdminOnly if the user is not a platform admin
  const filteredItems = items.filter(item => 
    !('platformAdminOnly' in item) || !(item as AdminNavItem).platformAdminOnly || isPlatformAdmin
  );
  
  return (
    <nav className={isMobile ? "flex flex-col space-y-2" : "flex space-x-4 overflow-x-auto"}>
      {isPlatformAdmin && (
        <div className={`${isMobile ? 'mb-2' : 'mr-4'}`}>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Platform Admin
          </Badge>
        </div>
      )}
      
      {filteredItems.map(item => (
        <Link 
          key={item.path}
          to={item.path} 
          className={`text-white hover:text-gray-200 px-2 ${isMobile ? 'py-2' : 'py-1'} rounded ${isMobile ? 'flex items-center' : 'whitespace-nowrap'}`}
          onClick={onMobileClose}
        >
          {item.icon && (
            <item.icon 
              className={`inline-block mr-1 h-4 w-4 ${isMobile ? 'mr-2' : ''}`} 
            />
          )}
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
};
