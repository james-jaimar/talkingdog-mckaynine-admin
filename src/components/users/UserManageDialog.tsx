
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "./hooks/useUsers";

interface UserManageDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function UserManageDialog({ user, open, onOpenChange, onUserUpdated }: UserManageDialogProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      onOpenChange(false);
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Role updated",
        description: `User role has been updated to ${selectedRole}.`,
      });
      
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update user role.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update role and permissions for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">
                Role
              </Label>
              <Select 
                defaultValue={user.role} 
                onValueChange={setSelectedRole}
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
              <Label className="text-sm font-medium mb-1 block">
                User ID
              </Label>
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
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRoleChange}
            disabled={isUpdating || selectedRole === user.role}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
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
