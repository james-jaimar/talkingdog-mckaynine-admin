
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { RefreshCw, UserPlus, MoreHorizontal, Key, UserCog } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/hooks/useUsers";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onAddUser: () => void;
  onEditRole: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export function UserTable({
  users,
  isLoading,
  onRefresh,
  isRefreshing,
  onAddUser,
  onEditRole,
  onResetPassword
}: UserTableProps) {
  const [filter, setFilter] = useState("");

  // Filter users by name or email
  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  // Role badge colors
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-blue-100 text-blue-800";
      case "branch_admin": return "bg-purple-100 text-purple-800";
      case "trainer": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search users..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={`loading-${i}`}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            )}

            {!isLoading && filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  {filter ? "No users match your search" : "No users found"}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  {user.isCurrentUser && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeClass(user.role || "user")}`}>
                    {user.role || "user"}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "PPP")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditRole(user)}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResetPassword(user)}>
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
