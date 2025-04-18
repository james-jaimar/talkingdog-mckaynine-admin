
import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Search, RefreshCw, UserPlus, MoreHorizontal, User, Key } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

export function UserAdminPanel() {
  // State
  const [filter, setFilter] = useState("");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [manageUserOpen, setManageUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [selectedRole, setSelectedRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState(null);

  // Hook
  const { 
    users, isLoading, refetch, addUser, updateRole, resetPassword 
  } = useUsers();

  // Filter users
  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(filter.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleManageUser = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setManageUserOpen(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setResetPasswordOpen(true);
  };

  const handleAddUser = async () => {
    try {
      setFormError(null);
      
      if (!newUserEmail || !newUserPassword || !newUserFullName || !newUserRole) {
        setFormError("All fields are required");
        return;
      }
      
      await addUser.mutateAsync({
        email: newUserEmail,
        password: newUserPassword,
        fullName: newUserFullName,
        role: newUserRole
      });
      
      // Reset form and close dialog
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserRole("user");
      setAddUserOpen(false);
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleUpdateRole = async () => {
    try {
      setFormError(null);
      
      if (!selectedRole) {
        setFormError("Please select a role");
        return;
      }
      
      await updateRole.mutateAsync({
        userId: selectedUser.id,
        role: selectedRole
      });
      
      setManageUserOpen(false);
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleResetUserPassword = async () => {
    try {
      setFormError(null);
      
      if (!newPassword) {
        setFormError("Please enter a new password");
        return;
      }
      
      await resetPassword.mutateAsync({
        userId: selectedUser.id,
        password: newPassword
      });
      
      setNewPassword("");
      setResetPasswordOpen(false);
    } catch (error) {
      setFormError(error.message);
    }
  };

  // Render
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-lg font-medium">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and access ({users.length})
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={() => setAddUserOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8 w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {filter ? (
                    <p>No users found matching "{filter}"</p>
                  ) : (
                    <p>No users found. Add some users to get started.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.full_name || user.email || "").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.isCurrentUser && (
                          <Badge variant="secondary" className="mt-1">You</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        user.role === 'trainer' ? 'bg-green-100 text-green-800 border-green-300' : 
                        'bg-gray-100 text-gray-800 border-gray-300'
                      }
                    >
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'PP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleManageUser(user)}>
                          <User className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account.</DialogDescription>
          </DialogHeader>
          
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={newUserEmail} 
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={newUserFullName} 
                onChange={(e) => setNewUserFullName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={newUserPassword} 
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)} disabled={addUser.isPending}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={addUser.isPending}>
              {addUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manage User Dialog */}
      <Dialog open={manageUserOpen} onOpenChange={setManageUserOpen}>
        {selectedUser && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User</DialogTitle>
              <DialogDescription>
                Update role for {selectedUser.full_name || selectedUser.email}
              </DialogDescription>
            </DialogHeader>
            
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
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
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setManageUserOpen(false)} disabled={updateRole.isPending}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRole} 
                disabled={updateRole.isPending || selectedRole === selectedUser.role}
              >
                {updateRole.isPending ? (
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
        )}
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        {selectedUser && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser.full_name || selectedUser.email}
              </DialogDescription>
            </DialogHeader>
            
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPasswordOpen(false)} disabled={resetPassword.isPending}>
                Cancel
              </Button>
              <Button onClick={handleResetUserPassword} disabled={resetPassword.isPending || !newPassword}>
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
        )}
      </Dialog>
    </div>
  );
}
