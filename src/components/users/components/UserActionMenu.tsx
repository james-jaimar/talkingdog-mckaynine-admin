
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserCog, Key } from "lucide-react";
import { UserProfile } from "../types/userTypes";

interface UserActionMenuProps {
  user: UserProfile;
  onEditRole: () => void;
  onResetPassword: () => void;
}

export function UserActionMenu({ user, onEditRole, onResetPassword }: UserActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEditRole}>
          <UserCog className="h-4 w-4 mr-2" />
          Edit Role
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetPassword}>
          <Key className="h-4 w-4 mr-2" />
          Reset Password
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
