
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserSectionProps {
  email?: string;
  role?: string;
  isMobile: boolean;
  onLogout: () => void;
}

export const UserSection = ({ email, role, isMobile, onLogout }: UserSectionProps) => {
  return (
    <div className="flex items-center gap-2">
      {!isMobile && (
        <span className="hidden md:inline-flex items-center">
          <User className="inline-block mr-1 h-4 w-4" />
          {email}
          {role && role.split(',').map(userRole => (
            <span 
              key={userRole} 
              className={`ml-1 text-xs px-1.5 py-0.5 rounded ${
                userRole === 'admin' ? 'bg-blue-600' :
                userRole === 'trainer' ? 'bg-green-600' :
                userRole === 'handler' ? 'bg-amber-600' : 'bg-gray-600'
              }`}
            >
              {userRole}
            </span>
          ))}
        </span>
      )}
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={onLogout}
        className="text-white hover:bg-red-700"
      >
        <LogOut className="h-4 w-4 md:mr-1" />
        <span className="hidden md:inline">Logout</span>
      </Button>
    </div>
  );
};
