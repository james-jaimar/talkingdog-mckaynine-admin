
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { User } from "./hooks/useUsers";

interface UserPasswordResetDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPasswordResetDialog({ user, open, onOpenChange }: UserPasswordResetDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast({
        title: "Missing password",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsResetting(true);
      
      // Reset user password
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      
      if (error) {
        throw error;
      }
      
      // Close dialog and reset form
      onOpenChange(false);
      setNewPassword("");
      
      // Show success message
      toast({
        title: "Password reset",
        description: `Password for ${user.email} has been reset successfully.`,
      });
      
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Failed to reset password",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter a new password for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
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
          <Button onClick={handleResetPassword} disabled={isResetting}>
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
    </Dialog>
  );
}
