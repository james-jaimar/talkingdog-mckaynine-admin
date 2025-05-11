
import { Link } from "react-router-dom";
import { trainerPrimaryNavItems } from "./navigation-items";

interface TrainerNavigationProps {
  className?: string;
}

export function TrainerNavigation({ className }: TrainerNavigationProps) {
  return (
    <nav className={className}>
      <ul className="flex items-center space-x-4">
        {trainerPrimaryNavItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
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
