import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useHandlerAccounts, HandlerAccount } from "@/hooks/useHandlerAccounts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Key, 
  UserMinus,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff
} from "lucide-react";

export default function HandlerAccounts() {
  const { isAdmin, isPlatformAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { 
    handlers, 
    isLoading, 
    refetch,
    createAccount,
    resetPassword,
    removeAccount
  } = useHandlerAccounts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHandler, setSelectedHandler] = useState<HandlerAccount | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin && !isPlatformAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, isPlatformAdmin, authLoading, navigate]);

  const filteredHandlers = handlers.filter(handler => 
    handler.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAccount = async () => {
    if (!selectedHandler || !password) return;
    
    try {
      await createAccount.mutateAsync({
        handlerId: selectedHandler.id,
        email: email || selectedHandler.email,
        password
      });
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleResetPassword = async () => {
    if (!selectedHandler?.id || !password) return;
    
    try {
      // Use handlerId instead of auth_user_id - the edge function validates the target is a handler
      await resetPassword.mutateAsync({
        handlerId: selectedHandler.id,
        password
      });
      setResetDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveAccount = async () => {
    if (!selectedHandler) return;
    
    try {
      await removeAccount.mutateAsync({
        handlerId: selectedHandler.id
      });
      setRemoveDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const openCreateDialog = (handler: HandlerAccount) => {
    setSelectedHandler(handler);
    setEmail(handler.email);
    setPassword("");
    setCreateDialogOpen(true);
  };

  const openResetDialog = (handler: HandlerAccount) => {
    setSelectedHandler(handler);
    setPassword("");
    setResetDialogOpen(true);
  };

  const openRemoveDialog = (handler: HandlerAccount) => {
    setSelectedHandler(handler);
    setRemoveDialogOpen(true);
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Checking permissions...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin && !isPlatformAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Handler Accounts</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Handler Accounts</h1>
            <p className="text-muted-foreground mt-1">
              Manage handler login credentials and portal access
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search handlers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredHandlers.length} handler{filteredHandlers.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading handlers...</span>
              </div>
            ) : filteredHandlers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No handlers found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Handler</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-center">Login Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHandlers.map((handler) => (
                      <TableRow key={handler.id}>
                        <TableCell className="font-medium">
                          {handler.first_name} {handler.last_name}
                        </TableCell>
                        <TableCell>{handler.email}</TableCell>
                        <TableCell>{handler.phone || "—"}</TableCell>
                        <TableCell className="text-center">
                          {handler.auth_user_id ? (
                            <Badge variant="default" className="bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <X className="h-3 w-3 mr-1" />
                              No Account
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {handler.auth_user_id ? (
                                <>
                                  <DropdownMenuItem onClick={() => openResetDialog(handler)}>
                                    <Key className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => openRemoveDialog(handler)}
                                    className="text-destructive"
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Remove Access
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem onClick={() => openCreateDialog(handler)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Create Account
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Handler Account</DialogTitle>
            <DialogDescription>
              Create a login account for {selectedHandler?.first_name} {selectedHandler?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="handler@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAccount}
              disabled={!password || createAccount.isPending}
            >
              {createAccount.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Handler Password</DialogTitle>
            <DialogDescription>
              You are about to reset the password for this handler account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Prominent display of target handler */}
            <div className="bg-muted p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Resetting password for:</p>
              <p className="font-semibold text-lg">
                {selectedHandler?.first_name} {selectedHandler?.last_name}
              </p>
              <p className="text-sm text-primary font-medium">{selectedHandler?.email}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setResetDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={!password || resetPassword.isPending}
            >
              {resetPassword.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Account Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Login Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove login access for {selectedHandler?.first_name} {selectedHandler?.last_name}. 
              They will no longer be able to access the handler portal. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAccount}
              disabled={removeAccount.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAccount.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
