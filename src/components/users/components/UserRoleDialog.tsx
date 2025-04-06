
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfile } from "../types/userTypes";

interface UserRoleDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (role: string) => void;
  isUpdating: boolean;
}

export function UserRoleDialog({
  user,
  open,
  onOpenChange,
  onRoleChange,
  isUpdating
}: UserRoleDialogProps) {
  if (!user) return null;
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>
          Update role and permissions for {user.full_name || user.username}
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Role
            </label>
            <Select 
              defaultValue={user.role} 
              onValueChange={onRoleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="handler">Handler</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              User ID
            </label>
            <Input 
              value={user.id} 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is the user's unique identifier
            </p>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button 
          disabled={isUpdating} 
          onClick={() => onOpenChange(false)}
        >
          {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
