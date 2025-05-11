
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { UserProfile } from "./types/userTypes";
import { useUserRoleManagement } from "./hooks/useUserRoleManagement";
import { useAuth } from "@/context/auth";

interface UserManageDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

export function UserManageDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: UserManageDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(user.role || "user");
  const [error, setError] = useState<string | null>(null);
  const { updateUserRole, isUpdating } = useUserRoleManagement();
  const { isPlatformAdmin } = useAuth();

  // Reset selected role and error when dialog opens with a new user
  useEffect(() => {
    if (open && user) {
      setSelectedRole(user.role || "user");
      setError(null);
    }
  }, [open, user]);

  const handleSave = async () => {
    try {
      setError(null);
      
      // Platform admin can only be set by another platform admin
      if (selectedRole === "platform_admin" && !isPlatformAdmin) {
        setError("Only platform admins can assign the platform admin role");
        return;
      }

      await updateUserRole({ userId: user.id, role: selectedRole });
      
      if (onUserUpdated) {
        onUserUpdated();
      }
      
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to update user role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>
            Update role for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {/* Only platform admins can see the platform_admin role */}
                {isPlatformAdmin && (
                  <SelectItem value="platform_admin">Platform Admin</SelectItem>
                )}
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="handler">Handler</SelectItem>
                <SelectItem value="user">Regular User</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedRole === "platform_admin" && "Full access to all branches and administrative functions"}
              {selectedRole === "admin" && "Full access to manage trainers, handlers and classes"}
              {selectedRole === "trainer" && "Can manage classes and view assigned handlers"}
              {selectedRole === "handler" && "Can access customer portal only"}
              {selectedRole === "user" && "Basic user access"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUpdating || selectedRole === user.role}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
