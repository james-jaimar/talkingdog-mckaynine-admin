
import { Link } from "react-router-dom";
import { trainerPrimaryNavItems, trainerSecondaryNavItems } from "./navigation-items";

interface TrainerNavigationProps {
  className?: string;
  isMobile?: boolean;
  showPrimaryOnly?: boolean;
  onMobileClose?: () => void;
}

export function TrainerNavigation({ 
  className,
  isMobile = false,
  showPrimaryOnly = true,
  onMobileClose
}: TrainerNavigationProps) {
  // Determine which navigation items to show
  const items = showPrimaryOnly ? trainerPrimaryNavItems : trainerSecondaryNavItems;
  
  return (
    <nav className={className}>
      <ul className={`${isMobile ? "flex flex-col space-y-2" : "flex items-center space-x-4"}`}>
        {items.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className={`flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary ${isMobile ? "py-2" : ""}`}
              onClick={onMobileClose}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
