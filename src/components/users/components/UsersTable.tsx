
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { UserActionMenu } from "./UserActionMenu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "../types/userTypes";

interface UsersTableProps {
  users: UserProfile[];
  isLoading: boolean;
  filteredUsers?: UserProfile[]; // Make this property optional
  onEditRole: (userId: string, currentRole: string) => void;
  onResetPassword: (userId: string) => void;
}

export function UsersTable({ users, filteredUsers, isLoading, onEditRole, onResetPassword }: UsersTableProps) {
  // Use filteredUsers if provided, otherwise use users
  const displayUsers = filteredUsers || users;
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'trainer':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (displayUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found.
      </div>
    );
  }

  return (
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
          {displayUsers.map((user) => {
            const initials = user.full_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || user.email?.[0]?.toUpperCase() || '?';

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.full_name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email || user.username || ''}
                      </div>
                      {user.isCurrentUser && (
                        <Badge variant="secondary" className="mt-1">You</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={getRoleBadgeVariant(user.role)}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), 'PP')}
                </TableCell>
                <TableCell className="text-right">
                  <UserActionMenu
                    user={user}
                    onEditRole={() => onEditRole(user.id, user.role)}
                    onResetPassword={() => onResetPassword(user.id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
