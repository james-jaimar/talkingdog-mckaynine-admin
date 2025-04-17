
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, Info, Search, RefreshCw, UserPlus, MoreHorizontal, Key, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { UserRoleDialog } from "@/components/users/UserRoleDialog";
import { UserPasswordResetDialog } from "@/components/users/UserPasswordResetDialog";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_ID } from "@/constants/app";
import { useUserManagement, User } from "@/hooks/useUserManagement";

export default function UserAdmin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // Fetch users with our simplified hook
  const {
    users,
    isLoading,
    refetch,
    usersNeedingMigration,
    migrateUsers
  } = useUserManagement({
    showAllUsers
  });

  // Filter users by name or email
  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  // Handle authentication check
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

  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordResetOpen(true);
  };

  const handleMigrateUsers = async () => {
    const usersToMigrate = users
      .filter(user => !user.app_id || user.app_id !== APP_ID)
      .map(user => user.id);
    
    if (usersToMigrate.length > 0) {
      await migrateUsers.mutateAsync(usersToMigrate);
    }
  };

  // Role badge colors
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-blue-100 text-blue-800";
      case "branch_admin": return "bg-purple-100 text-purple-800";
      case "trainer": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">User Administration</h1>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Users ({users.length})</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-all-users"
                    checked={showAllUsers}
                    onCheckedChange={setShowAllUsers}
                  />
                  <Label htmlFor="show-all-users">Show all users</Label>
                </div>
                
                {usersNeedingMigration > 0 && (
                  <Button onClick={handleMigrateUsers} disabled={migrateUsers.isPending}>
                    {migrateUsers.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      `Migrate ${usersNeedingMigration} users`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 && !isLoading && (
              <Alert className="mb-6 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertTitle>No users found</AlertTitle>
                <AlertDescription>
                  {showAllUsers ? (
                    "No users found in the database."
                  ) : (
                    <>
                      No users found with the current app_id: <strong>{APP_ID}</strong>. 
                      Try using the "Show all users" toggle to see all users in the system, 
                      then migrate them to the current app.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-8 max-w-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={() => setAddUserOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
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
                    {isLoading && (
                      Array(3).fill(0).map((_, i) => (
                        <TableRow key={`loading-${i}`}>
                          <TableCell>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    )}

                    {!isLoading && filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          {filter ? "No users match your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.isCurrentUser && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "PPP")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRole(user)}>
                                <UserCog className="h-4 w-4 mr-2" />
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Dialogs */}
        <UserRoleDialog
          user={selectedUser}
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          onSuccess={handleRefresh}
        />
        
        <UserPasswordResetDialog
          user={selectedUser}
          open={passwordResetOpen}
          onOpenChange={setPasswordResetOpen}
        />
        
        <AddUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onSuccess={handleRefresh}
        />
      </div>
    </DashboardLayout>
  );
}
