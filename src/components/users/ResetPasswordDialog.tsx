
import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { UserProfile } from "./hooks/useUsersData";

interface ResetPasswordDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (password: string) => void;
  isResetting: boolean;
}

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
  onReset,
  isResetting,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");

  const handleReset = () => {
    if (newPassword.trim()) {
      onReset(newPassword);
      setNewPassword(""); // Clear the password field
    }
  };

  if (!user) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogDescription>
          Enter a new password for {user.full_name || user.email}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-4">
        <div className="space-y-1">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            onOpenChange(false);
            setNewPassword("");
          }}
          disabled={isResetting}
        >
          Cancel
        </Button>
        <Button onClick={handleReset} disabled={!newPassword.trim() || isResetting}>
          {isResetting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
