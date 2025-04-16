
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { User } from "./hooks/useUsers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRoleManagement } from "./hooks/useUserRoleManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserManageDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function UserManageDialog({ 
  user, 
  open, 
  onOpenChange, 
  onUserUpdated 
}: UserManageDialogProps) {
  const [role, setRole] = useState(user.role || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { updateUserRole, isUpdating } = useUserRoleManagement();

  // Reset state when dialog opens with a different user
  useEffect(() => {
    if (open) {
      setRole(user.role || '');
      setErrorMessage(null);
    }
  }, [open, user]);

  const handleUpdateUser = async () => {
    if (!role) {
      setErrorMessage("Please select a role");
      return;
    }

    setErrorMessage(null);
    
    try {
      console.log(`[UserManageDialog] Updating user ${user.id} to role: ${role}`);
      
      await updateUserRole({ 
        userId: user.id, 
        role 
      });
      
      onOpenChange(false);
      onUserUpdated();
      
    } catch (error) {
      console.error("[UserManageDialog] Error updating user:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>
            Update role and settings for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
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
          
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input id="userId" value={user.id} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              This is the user's unique identifier in the database
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateUser} 
            disabled={isUpdating || !role || role === user.role}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
