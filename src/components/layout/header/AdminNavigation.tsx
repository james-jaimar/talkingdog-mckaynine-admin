import { Link } from "react-router-dom";
import { adminPrimaryNavItems, adminSecondaryNavItems } from "./navigation-items";
import { useAuth } from "@/context/auth";
import { Badge } from "@/components/ui/badge";
import { usePendingTaskCount } from "@/hooks/useAllTasks";
import { usePendingTrainerNoteCount } from "@/hooks/useTrainerNotes";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AdminNavigationProps {
  isMobile: boolean;
  onMobileClose?: () => void;
  showPrimaryOnly?: boolean;
}

export const AdminNavigation = ({ isMobile, onMobileClose, showPrimaryOnly = true }: AdminNavigationProps) => {
  const { isPlatformAdmin } = useAuth();
  const { count: pendingTaskCount } = usePendingTaskCount();
  const { count: pendingTrainerNoteCount } = usePendingTrainerNoteCount();
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  const items = showPrimaryOnly ? adminPrimaryNavItems : adminSecondaryNavItems;
  
  // Filter out developer-only items for non-platform admins
  const filteredItems = items.filter(item => {
    // Show all items to platform admins
    if (isPlatformAdmin) return true;
    // Hide developer-only items from regular admins
    return !item.developerOnly;
  });

  // For mobile, separate priority items from others
  const mobileItems = isMobile && showPrimaryOnly 
    ? filteredItems.filter(item => (item as any).mobileShow !== false)
    : filteredItems;
  
  const moreItems = isMobile && showPrimaryOnly
    ? [...filteredItems.filter(item => (item as any).mobileShow === false), ...adminSecondaryNavItems.filter(item => {
        if (isPlatformAdmin) return true;
        return !item.developerOnly;
      })]
    : [];
  
  return (
    <nav className={isMobile ? "flex flex-col space-y-1" : "flex space-x-4 flex-nowrap max-w-full"}>
      {isPlatformAdmin && (
        <div className={`${isMobile ? 'mb-2' : 'mr-4'} flex-shrink-0`}>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Platform Admin
          </Badge>
        </div>
      )}
      
      {mobileItems.map(item => (
        <Link 
          key={item.path}
          to={item.path} 
          className={`text-white hover:text-gray-200 active:bg-mckaynine-800 px-3 ${isMobile ? 'py-3 flex items-center rounded-lg' : 'py-1 flex items-center flex-shrink-0 whitespace-nowrap rounded'} relative`}
          onClick={onMobileClose}
        >
          {item.icon && (
            <item.icon 
              className={`inline-block h-5 w-5 ${isMobile ? 'mr-3' : 'mr-1'}`} 
            />
          )}
          <span className={isMobile ? 'text-base' : ''}>{item.name}</span>
          {item.name === "Tasks" && pendingTaskCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
            </span>
          )}
          {item.name === "Trainer Notes" && pendingTrainerNoteCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {pendingTrainerNoteCount > 99 ? "99+" : pendingTrainerNoteCount}
            </span>
          )}
        </Link>
      ))}

      {/* Mobile "More" section */}
      {isMobile && moreItems.length > 0 && (
        <>
          <button
            onClick={() => setShowMoreMobile(!showMoreMobile)}
            className="text-white hover:text-gray-200 active:bg-mckaynine-800 px-3 py-3 flex items-center justify-between rounded-lg w-full"
          >
            <span className="text-base">More Options</span>
            {showMoreMobile ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          
          {showMoreMobile && (
            <div className="pl-4 space-y-1 border-l-2 border-mckaynine-500 ml-3">
              {moreItems.map(item => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className="text-white/90 hover:text-white active:bg-mckaynine-800 px-3 py-2 flex items-center rounded-lg relative"
                  onClick={onMobileClose}
                >
                  {item.icon && (
                    <item.icon className="inline-block h-4 w-4 mr-3" />
                  )}
                  <span className="text-sm">{item.name}</span>
                  {item.name === "Tasks" && pendingTaskCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
                    </span>
                  )}
                  {item.name === "Trainer Notes" && pendingTrainerNoteCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {pendingTrainerNoteCount > 99 ? "99+" : pendingTrainerNoteCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </nav>
  );
};
