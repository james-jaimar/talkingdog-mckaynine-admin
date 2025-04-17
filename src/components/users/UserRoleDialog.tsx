
import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserProfile } from "./types/userTypes";
import { useUserManagement } from "@/hooks/useUserManagement";

interface UserRoleDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserRoleDialog({ 
  user, 
  open, 
  onOpenChange,
  onSuccess
}: UserRoleDialogProps) {
  const [newRole, setNewRole] = useState(user?.role || "");
  const [error, setError] = useState<string | null>(null);
  const { updateRole } = useUserManagement();
  
  useEffect(() => {
    if (user && open) {
      setNewRole(user.role);
      setError(null);
    }
  }, [user, open]);
  
  const handleSave = async () => {
    if (!user || !newRole) {
      setError("Please select a valid role");
      return;
    }
    
    setError(null);
    
    try {
      await updateRole.mutateAsync({ 
        userId: user.id, 
        role: newRole 
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            {user && `Update role for ${user.full_name || user.email}`}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateRole.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateRole.isPending || !newRole || newRole === user?.role}>
            {updateRole.isPending ? (
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
