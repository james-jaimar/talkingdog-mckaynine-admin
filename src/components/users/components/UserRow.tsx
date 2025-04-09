
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, Key } from "lucide-react";
import { UserProfile } from "../types/userTypes";

interface UserRowProps {
  user: UserProfile;
  onEditRole: (userId: string, currentRole: string) => void;
  onResetPassword: (userId: string) => void;
}

export function UserRow({ user, onEditRole, onResetPassword }: UserRowProps) {
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-blue-100 text-blue-800";
      case "trainer": return "bg-green-100 text-green-800";
      case "handler": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <TableRow>
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
        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
          {user.role || "user"}
        </span>
      </TableCell>
      <TableCell>
        {format(new Date(user.created_at), "PP")}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditRole(user.id, user.role)}>
              <User className="h-4 w-4 mr-2" />
              Edit Role
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
