
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { User } from "./hooks/useUsers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [role, setRole] = useState(user.role);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateUser = async () => {
    try {
      setIsUpdating(true);
      
      // Import the APP_ID
      const { APP_ID } = await import('@/constants/app');
      
      // Update the user's role in the database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role,
          app_id: APP_ID // Ensure app_id is always set when updating
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: "User updated",
        description: `Role for ${user.full_name || user.email} has been updated to ${role}.`,
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Refresh user list
      onUserUpdated();
      
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Failed to update user",
        description: error.message || "An unexpected error occurred.",
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
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>
            Update role and settings for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
          <Button onClick={handleUpdateUser} disabled={isUpdating}>
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
