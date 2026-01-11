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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { UserProfile } from "./types/userTypes";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UserEditDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: UserEditDialogProps) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [selectedRole, setSelectedRole] = useState<string>(user.role || "user");
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isPlatformAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when dialog opens with a new user
  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name || "");
      setSelectedRole(user.role || "user");
      setError(null);
    }
  }, [open, user]);

  const handleSave = async () => {
    try {
      setError(null);
      setIsUpdating(true);
      
      // Platform admin can only be set by another platform admin
      if (selectedRole === "platform_admin" && !isPlatformAdmin) {
        setError("Only platform admins can assign the platform admin role");
        return;
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update role if changed
      if (selectedRole !== user.role) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("Not authenticated");
        }

        const { error: roleError } = await supabase.functions.invoke('user-role', {
          method: 'POST',
          body: { userId: user.id, role: selectedRole },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (roleError) throw roleError;
      }

      toast({
        title: "User updated",
        description: "User details have been updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      
      if (onUserUpdated) {
        onUserUpdated();
      }
      
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError(err.message || "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update details for {user.email}
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
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

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
            disabled={isUpdating}
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
