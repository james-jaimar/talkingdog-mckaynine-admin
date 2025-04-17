
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile } from "../types/userTypes";
import { MoreHorizontal, User, Key } from "lucide-react";

interface UserActionMenuProps {
  user: UserProfile;
  onEditRole: () => void;
  onResetPassword: () => void;
}

export function UserActionMenu({ user, onEditRole, onResetPassword }: UserActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEditRole}>
          <User className="h-4 w-4 mr-2" />
          <span>Edit Role</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetPassword}>
          <Key className="h-4 w-4 mr-2" />
          <span>Reset Password</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
