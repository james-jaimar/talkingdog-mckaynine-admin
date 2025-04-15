
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { adminPrimaryNavItems, adminSecondaryNavItems } from "./navigation-items";

interface AdminNavigationProps {
  isMobile: boolean;
  onMobileClose?: () => void;
}

export const AdminNavigation = ({ isMobile, onMobileClose }: AdminNavigationProps) => {
  return isMobile ? (
    <nav className="flex flex-col space-y-2">
      {[...adminPrimaryNavItems, ...adminSecondaryNavItems].map(item => (
        <Link 
          key={item.path}
          to={item.path} 
          className="text-white hover:text-gray-200 px-2 py-2 rounded flex items-center"
          onClick={onMobileClose}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  ) : (
    <>
      <nav className="hidden md:flex space-x-4 overflow-x-auto">
        {adminPrimaryNavItems.map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap"
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="bg-mckaynine-700">
        <div className="container mx-auto px-4 py-1">
          <nav className="flex space-x-4 overflow-x-auto">
            {adminSecondaryNavItems.map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className="text-white hover:text-gray-200 px-2 py-1 text-sm rounded whitespace-nowrap"
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};
