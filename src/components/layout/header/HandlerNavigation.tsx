
import { Link } from "react-router-dom";
import { handlerNavItems } from "./navigation-items";

interface HandlerNavigationProps {
  isMobile: boolean;
  onMobileClose?: () => void;
}

export const HandlerNavigation = ({ isMobile, onMobileClose }: HandlerNavigationProps) => {
  return (
    <nav className={isMobile ? "flex flex-col space-y-2" : "flex space-x-4 overflow-x-auto"}>
      {handlerNavItems.map(item => (
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
