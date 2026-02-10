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
import { AlertCircle, Loader2, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "./types/userTypes";
import { useUserRoleManagement } from "./hooks/useUserRoleManagement";
import { useAuth } from "@/context/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserManageDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

const ALL_ROLES = [
  { value: "platform_admin", label: "Platform Admin", description: "Full access to all branches and administrative functions", adminOnly: true },
  { value: "admin", label: "Admin", description: "Full access to manage trainers, handlers and classes" },
  { value: "trainer", label: "Trainer", description: "Can manage classes and view assigned handlers" },
  { value: "assistant", label: "Assistant", description: "Can manage availability and assist with training sessions" },
  { value: "handler", label: "Handler", description: "Can access customer portal only" },
  { value: "user", label: "Regular User", description: "Basic user access" },
];

export function UserManageDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: UserManageDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [roleToAdd, setRoleToAdd] = useState<string>("");
  const { updateUserRole, isUpdating } = useUserRoleManagement();
  const { isPlatformAdmin } = useAuth();

  const { data: currentRoles = [], refetch: refetchRoles } = useQuery({
    queryKey: ['user-roles', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      return (data || []).map(r => r.role as string);
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setError(null);
      setRoleToAdd("");
    }
  }, [open, user]);

  // Roles available to add (not already assigned)
  const availableRoles = ALL_ROLES.filter(r => {
    if (r.adminOnly && !isPlatformAdmin) return false;
    return !currentRoles.includes(r.value);
  });

  const handleAddRole = async () => {
    if (!roleToAdd) return;
    setError(null);

    if (roleToAdd === "platform_admin" && !isPlatformAdmin) {
      setError("Only platform admins can assign the platform admin role");
      return;
    }

    try {
      await updateUserRole({ userId: user.id, role: roleToAdd, operation: "addRole" });
      setRoleToAdd("");
      await refetchRoles();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to add role");
    }
  };

  const handleRemoveRole = async (roleToRemove: string) => {
    if (currentRoles.length <= 1) {
      setError("User must have at least one role");
      return;
    }
    setError(null);

    try {
      await updateUserRole({ userId: user.id, role: roleToRemove, operation: "removeRole" });
      await refetchRoles();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to remove role");
    }
  };

  const getRoleLabel = (role: string) => {
    return ALL_ROLES.find(r => r.value === role)?.label || role;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Manage roles for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          {/* Current roles */}
          <div className="space-y-2">
            <Label>Current Roles</Label>
            <div className="flex flex-wrap gap-2">
              {currentRoles.map(role => (
                <Badge key={role} variant="secondary" className="flex items-center gap-1 text-sm py-1 px-3">
                  {getRoleLabel(role)}
                  {currentRoles.length > 1 && (
                    <button
                      onClick={() => handleRemoveRole(role)}
                      disabled={isUpdating}
                      className="ml-1 hover:text-destructive transition-colors"
                      aria-label={`Remove ${getRoleLabel(role)} role`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Add role */}
          {availableRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Add Role</Label>
              <div className="flex gap-2">
                <Select value={roleToAdd} onValueChange={setRoleToAdd} disabled={isUpdating}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select role to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddRole} disabled={isUpdating || !roleToAdd} size="icon">
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              {roleToAdd && (
                <p className="text-xs text-muted-foreground">
                  {ALL_ROLES.find(r => r.value === roleToAdd)?.description}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
