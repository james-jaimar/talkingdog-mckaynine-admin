
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";

interface UserTableActionsProps {
  onRefresh: () => void;
  onAddUser: () => void;
  isRefreshing: boolean;
  userCount: number;
}

export function UserTableActions({ onRefresh, onAddUser, isRefreshing, userCount }: UserTableActionsProps) {
  return (
    <div className="flex flex-row items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Users ({userCount})</h2>
        <p className="text-muted-foreground">
          Manage user access and permissions
        </p>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          size="sm" 
          onClick={onAddUser}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
    </div>
  );
}
