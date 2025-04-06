
import { RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserTableHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onAddUser: () => void;
  filter: string;
  onFilterChange: (value: string) => void;
}

export function UserTableHeader({
  onRefresh,
  isRefreshing,
  onAddUser,
  filter,
  onFilterChange,
}: UserTableHeaderProps) {
  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and access roles.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={onAddUser}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        </div>
      </div>
      
      <div className="relative mb-4 mt-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search users..."
          className="pl-8"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
        />
      </div>
    </>
  );
}
