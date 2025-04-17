
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { UserActionMenu } from "./UserActionMenu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "../types/userTypes";

interface UsersTableProps {
  users: UserProfile[];
  filteredUsers?: UserProfile[]; // Make this optional
  isLoading: boolean;
  onEditRole: (userId: string, currentRole: string) => void; // Updated to match expected signature
  onResetPassword: (userId: string) => void;
}

export function UsersTable({ 
  users, 
  filteredUsers = users, // Default to all users if not provided
  isLoading, 
  onEditRole, 
  onResetPassword 
}: UsersTableProps) {
  // Helper for role badge styling
  const getRoleBadgeVariant = (role: string) => {
    const roles = role.split(',');
    
    if (roles.includes('admin')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (roles.includes('trainer')) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (roles.includes('handler')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Generate user initials for avatar
  const getUserInitials = (user: UserProfile) => {
    if (!user.full_name) {
      return user.email?.[0]?.toUpperCase() || '?';
    }
    
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  const displayedUsers = filteredUsers || users;

  if (displayedUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-md p-6">
        No users found matching your criteria.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
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
          {displayedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.full_name || 'Unnamed User'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    {user.isCurrentUser && (
                      <Badge variant="secondary" className="mt-1">You</Badge>
                    )}
                    {!user.app_id && (
                      <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-800 border-amber-200">
                        No App ID
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={getRoleBadgeVariant(user.role || 'user')}
                >
                  {user.role || 'user'}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(user.created_at), 'PP')}
              </TableCell>
              <TableCell className="text-right">
                <UserActionMenu
                  user={user}
                  onEditRole={() => onEditRole(user.id, user.role || '')}
                  onResetPassword={() => onResetPassword(user.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
