
import { Link } from "react-router-dom";
import { adminPrimaryNavItems, trainerNavItems } from "./navigation-items";

interface TrainerNavigationProps {
  isMobile: boolean;
  onMobileClose?: () => void;
}

export const TrainerNavigation = ({ isMobile, onMobileClose }: TrainerNavigationProps) => {
  return isMobile ? (
    <nav className="flex flex-col space-y-2">
      {[...adminPrimaryNavItems.slice(0, 5), ...trainerNavItems].map(item => (
        <Link 
          key={item.path}
          to={item.path} 
          className="text-white hover:text-gray-200 px-2 py-2 rounded flex items-center"
          onClick={onMobileClose}
        >
          {item.icon && (
            <item.icon 
              className="inline-block mr-2 h-4 w-4" 
            />
          )}
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  ) : (
    <>
      <nav className="hidden md:flex space-x-4 overflow-x-auto">
        {adminPrimaryNavItems.slice(0, 5).map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className="text-white hover:text-gray-200 px-2 py-1 rounded whitespace-nowrap"
          >
            {item.icon && (
              <item.icon 
                className="inline-block mr-1 h-4 w-4" 
              />
            )}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="bg-mckaynine-700">
        <div className="container mx-auto px-4 py-1">
          <nav className="flex space-x-4 overflow-x-auto">
            {trainerNavItems.filter(item => item.name === "Invoices").map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className="text-white hover:text-gray-200 px-2 py-1 text-sm rounded whitespace-nowrap"
              >
                {item.icon && (
                  <item.icon 
                    className="inline-block mr-1 h-4 w-4" 
                  />
                )}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};
