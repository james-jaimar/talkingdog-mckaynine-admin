
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile } from "../types/userTypes";
import { MoreHorizontal, User, Key } from "lucide-react";
import { useDropdownState } from "@/hooks/useDropdownState";

interface UserActionMenuProps {
  user: UserProfile;
  onEditRole: () => void;
  onResetPassword: () => void;
}

export function UserActionMenu({ user, onEditRole, onResetPassword }: UserActionMenuProps) {
  const { isOpen, setIsOpen, onClose } = useDropdownState();

  const handleEditRole = () => {
    onEditRole();
    onClose();
  };

  const handleResetPassword = () => {
    onResetPassword();
    onClose();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background z-50">
        <DropdownMenuItem onClick={handleEditRole}>
          <User className="h-4 w-4 mr-2" />
          <span>Edit Role</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetPassword}>
          <Key className="h-4 w-4 mr-2" />
          <span>Reset Password</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
