
import { useState, useEffect } from "react";
import { useUsersData, UserProfile } from "./hooks/useUsersData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Loader2, Search, UserCog, Key, RefreshCw } from "lucide-react";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { AddUserDialog } from "./AddUserDialog";

export function UserTable() {
  // Get user data from the hook
  const {
    users,
    isLoading,
    error,
    updateUserRole,
    isUpdating,
    trainers,
    isLoadingTrainers,
    linkTrainerToUser,
    unlinkTrainerFromUser,
    refetchUsers,
    adminSetupAttempted
  } = useUsersData();

  // Local state
  const [filter, setFilter] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<UserProfile | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter users by name or email
  const filteredUsers = users.filter(
    (user) =>
      (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  // Log users data for debugging
  useEffect(() => {
    console.log(`UserTable - Total users: ${users.length}, Filtered users: ${filteredUsers.length}`);
    if (users.length > 0) {
      console.log("Users data in UserTable:", users);
    }
  }, [users, filteredUsers]);

  // Listen for user creation events
  useEffect(() => {
    const handleUserCreated = () => {
      console.log("User created event received, refreshing data...");
      refetchUsers();
    };
    
    window.addEventListener('user-created', handleUserCreated);
    
    return () => {
      window.removeEventListener('user-created', handleUserCreated);
    };
  }, [refetchUsers]);

  // Auto-refresh when the component mounts
  useEffect(() => {
    console.log("UserTable mounted, fetching all users...");
    refetchUsers();
  }, [refetchUsers]);

  // Role change handler
  const handleRoleChange = (role: string) => {
    if (editingUser) {
      updateUserRole({ userId: editingUser.id, role });
      setEditingUser(null);
    }
  };

  // Password reset handler
  const handleResetPassword = (user: UserProfile) => {
    setUserToResetPassword(user);
    setResetPasswordOpen(true);
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log("Manual refresh clicked, fetching all users...");
    await refetchUsers();
    setIsRefreshing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Users</CardTitle>
          <CardDescription>
            There was a problem loading the user data. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Error details: {error instanceof Error ? error.message : String(error)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            Manage user accounts and access roles.
          </CardDescription>
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
          <AddUserDialog />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.full_name || "—"}
                      {user.isCurrentUser && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === "admin" 
                          ? "bg-blue-100 text-blue-800" 
                          : user.role === "trainer" 
                            ? "bg-green-100 text-green-800" 
                            : user.role === "handler"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.role || "user"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isLoadingTrainers ? (
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      ) : (
                        <div>
                          {user.trainer ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {user.trainer.first_name} {user.trainer.last_name}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 p-0 text-xs text-red-500 hover:text-red-700"
                                onClick={() => unlinkTrainerFromUser(user.id, user.trainer!.id)}
                              >
                                Unlink
                              </Button>
                            </div>
                          ) : user.role === "trainer" ? (
                            <Select onValueChange={(trainerId) => linkTrainerToUser(user.id, trainerId)}>
                              <SelectTrigger className="h-7 text-xs w-[180px]">
                                <SelectValue placeholder="Link to trainer" />
                              </SelectTrigger>
                              <SelectContent>
                                {trainers.filter(t => !t.user_id).map((trainer) => (
                                  <SelectItem key={trainer.id} value={trainer.id}>
                                    {trainer.first_name} {trainer.last_name}
                                  </SelectItem>
                                ))}
                                {trainers.filter(t => !t.user_id).length === 0 && (
                                  <SelectItem value="none" disabled>
                                    No unlinked trainers
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not a trainer</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.created_at 
                        ? format(new Date(user.created_at), "PPP") 
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingUser(user)}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          {editingUser && editingUser.id === user.id && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                  Update role and permissions for {editingUser.full_name || editingUser.username}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="py-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">
                                      Role
                                    </label>
                                    <Select 
                                      defaultValue={editingUser.role} 
                                      onValueChange={handleRoleChange}
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
                                    <label className="text-sm font-medium mb-1 block">
                                      User ID
                                    </label>
                                    <Input 
                                      value={editingUser.id} 
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
                                  onClick={() => setEditingUser(null)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  disabled={isUpdating} 
                                  onClick={() => {
                                    // Dialog will close automatically when the select changes
                                    // But we provide this button for UX purposes
                                    setEditingUser(null);
                                  }}
                                >
                                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          )}
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Password Reset Dialog */}
      {userToResetPassword && (
        <ResetPasswordDialog 
          user={userToResetPassword}
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
        />
      )}
    </Card>
  );
}
