
import { Link } from "react-router-dom";
import { handlerPrimaryNavItems, handlerSecondaryNavItems } from "./navigation-items";

interface HandlerNavigationProps {
  className?: string;
}

export function HandlerNavigation({ className }: HandlerNavigationProps) {
  return (
    <nav className={className}>
      <ul className="flex items-center space-x-4">
        {handlerPrimaryNavItems.map((item) => (
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
