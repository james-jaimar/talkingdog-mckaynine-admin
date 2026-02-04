
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Copy, Check, RefreshCw, Key, UserPlus, UserMinus } from "lucide-react";
import { 
  useCreateAssistantAccount, 
  useResetAssistantPassword, 
  useRemoveAssistantAccount,
  generateSecurePassword 
} from "@/hooks/useAssistantAccount";
import { Assistant } from "@/hooks/useAssistants";

interface AssistantPortalAccessProps {
  assistant: Assistant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantPortalAccess({ assistant, open, onOpenChange }: AssistantPortalAccessProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const createAccount = useCreateAssistantAccount();
  const resetPassword = useResetAssistantPassword();
  const removeAccount = useRemoveAssistantAccount();

  const hasAccount = !!assistant.user_id;

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setPassword(newPassword);
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setPassword("");
    setShowPassword(false);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreateAccount = async () => {
    if (!password || password.length < 8) {
      return;
    }

    await createAccount.mutateAsync({
      assistantId: assistant.id,
      email: assistant.email,
      password,
    });

    handleClose();
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 8) {
      return;
    }

    await resetPassword.mutateAsync({
      assistantId: assistant.id,
      password,
    });

    handleClose();
  };

  const handleRemoveAccount = async () => {
    await removeAccount.mutateAsync({
      assistantId: assistant.id,
    });

    setRemoveDialogOpen(false);
    handleClose();
  };

  const isLoading = createAccount.isPending || resetPassword.isPending || removeAccount.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Portal Access - {assistant.first_name} {assistant.last_name}
            </DialogTitle>
            <DialogDescription>
              {hasAccount 
                ? "Manage login credentials for this assistant"
                : "Create a login account for this assistant to access the portal"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={assistant.email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">
                  {hasAccount ? "New Password" : "Password"}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGeneratePassword}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  className="pr-20"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {password && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopyPassword}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
              {password && password.length < 8 && (
                <p className="text-xs text-destructive">Password must be at least 8 characters</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {hasAccount && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setRemoveDialogOpen(true)}
                disabled={isLoading}
                className="sm:mr-auto"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Access
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            {hasAccount ? (
              <Button 
                onClick={handleResetPassword} 
                disabled={isLoading || !password || password.length < 8}
              >
                {resetPassword.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            ) : (
              <Button 
                onClick={handleCreateAccount} 
                disabled={isLoading || !password || password.length < 8}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {createAccount.isPending ? "Creating..." : "Create Account"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Portal Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the login account for {assistant.first_name} {assistant.last_name}. 
              They will no longer be able to log in to the assistant portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAccount.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAccount}
              disabled={removeAccount.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAccount.isPending ? "Removing..." : "Remove Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
