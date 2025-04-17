
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Key, UserCog } from "lucide-react";
import { UserProfile } from "../types/userTypes";

interface UserTableRowProps {
  user: UserProfile;
  onManageUser: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
}

export function UserTableRow({ user, onManageUser, onResetPassword }: UserTableRowProps) {
  // Helper to determine the badge color based on user role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'trainer':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'handler':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.full_name || 'No name'}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge 
          variant="outline" 
          className={getRoleBadgeColor(user.role)}
        >
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onManageUser(user)}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Edit Role
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onResetPassword(user)}
            >
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
