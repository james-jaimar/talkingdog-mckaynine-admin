
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
import { User } from "@/hooks/useUsers";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserRoleDialogProps {
  user: User | null;
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
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { updateUserRole } = useUserRole();
  
  useEffect(() => {
    if (user && open) {
      setRole(user.role || "");
      setError(null);
    }
  }, [user, open]);
  
  const handleSave = async () => {
    if (!user || !role) {
      setError("Please select a role");
      return;
    }
    
    try {
      await updateUserRole.mutateAsync({ 
        userId: user.id, 
        role 
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(message);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
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
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="branch_admin">Branch Admin</SelectItem>
              <SelectItem value="trainer">Trainer</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateUserRole.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateUserRole.isPending || !role || role === user?.role}>
            {updateUserRole.isPending ? (
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
