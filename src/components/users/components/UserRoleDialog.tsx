import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { UserProfile } from "../types/userTypes";
import { useUserRoleManagement } from "../hooks/useUserRoleManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserProfile | null;
  onSaveRole?: (newRole: string) => Promise<void>;
  onSuccess?: () => void;
}

export function UserRoleDialog({ 
  open, 
  onOpenChange, 
  selectedUser,
  onSaveRole,
  onSuccess
}: UserRoleDialogProps) {
  const [newRole, setNewRole] = useState(selectedUser?.role || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { updateUserRole, isUpdating } = useUserRoleManagement();

  // Reset state when dialog opens with a different user
  useEffect(() => {
    if (open && selectedUser) {
      console.log("[UserRoleDialog] Dialog opened with user:", selectedUser);
      setNewRole(selectedUser.role || "");
      setErrorMessage(null);
    }
  }, [open, selectedUser]);
  
  const handleSave = async () => {
    if (!selectedUser || !newRole) {
      setErrorMessage("Please select a valid role");
      return;
    }
    
    setErrorMessage(null);
    
    try {
      console.log(`[UserRoleDialog] Updating user ${selectedUser.id} to role: ${newRole}`);
      
      // If a custom onSaveRole handler is provided, use it
      if (onSaveRole) {
        await onSaveRole(newRole);
      } else {
        // Otherwise use the default role management hook
        await updateUserRole({
          userId: selectedUser.id,
          role: newRole
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("[UserRoleDialog] Error updating role:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            {selectedUser && `Update role for ${selectedUser.full_name || selectedUser.email || selectedUser.username}`}
          </DialogDescription>
        </DialogHeader>
        
        {errorMessage && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="py-4">
          <Select value={newRole} onValueChange={setNewRole}>
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
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating || !newRole}>
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
