
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, EyeOff, Eye } from "lucide-react";
import { User, useUserManagement } from "@/hooks/useUserManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserPasswordResetDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPasswordResetDialog({
  user,
  open,
  onOpenChange
}: UserPasswordResetDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useUserManagement();
  
  const handleResetPassword = async () => {
    if (!user) return;
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setError(null);
    
    try {
      await resetPassword.mutateAsync({ userId: user.id, password });
      setPassword("");
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset password");
    }
  };
  
  const toggleShowPassword = () => setShowPassword(prev => !prev);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {user && `Set a new password for ${user.full_name || user.email}`}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="py-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={toggleShowPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={resetPassword.isPending}>
            Cancel
          </Button>
          <Button onClick={handleResetPassword} disabled={resetPassword.isPending || !password}>
            {resetPassword.isPending ? (
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
    </Dialog>
  );
}
