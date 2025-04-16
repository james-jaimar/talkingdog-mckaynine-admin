
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, UserPlus } from "lucide-react";

interface UserListHeaderProps {
  onRefresh: () => void;
  onAddUser: () => void;
  isRefreshing: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function UserListHeader({
  onRefresh,
  onAddUser,
  isRefreshing,
  searchTerm,
  onSearchChange
}: UserListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
      <div className="flex-1 max-w-sm">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={onAddUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
    </div>
  );
}
