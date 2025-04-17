
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";
import { UsersTable } from "@/components/users/components/UsersTable";
import { UserManageDialog } from "@/components/users/UserManageDialog";
import { UserPasswordResetDialog } from "@/components/users/UserPasswordResetDialog";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MigrateUsersButton } from "@/components/users/components/MigrateUsersButton";
import { useUsersList } from "@/components/users/hooks/useUsersList";

export default function UserAdmin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch users with simplified hook
  const {
    users,
    isLoading,
    refetch,
    usersWithoutAppId,
    isRefetching
  } = useUsersList({
    showAllUsers,
    enabled: !authLoading && isAdmin
  });

  // Create a simple wrapper function for migration completion
  const handleMigrationComplete = async () => {
    await refetch();
  };

  // Handle authentication check
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
            <span className="ml-2">Checking permissions...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleEditRole = (userId: string) => {
    setSelectedUserId(userId);
    setManageDialogOpen(true);
  };

  const handleResetPassword = (userId: string) => {
    setSelectedUserId(userId);
    setResetPasswordOpen(true);
  };

  // Find the selected user for dialogs
  const selectedUser = users.find(user => user.id === selectedUserId) || null;

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration - McKaynine Training Centre</title>
      </Helmet>

      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">User Administration</h1>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle>Users ({users.length})</CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-all-users"
                    checked={showAllUsers}
                    onCheckedChange={setShowAllUsers}
                  />
                  <Label htmlFor="show-all-users">Show all users</Label>
                </div>
                
                {usersWithoutAppId > 0 && (
                  <MigrateUsersButton onComplete={handleMigrationComplete} />
                )}
              </div>
            </div>
            
            {usersWithoutAppId > 0 && (
              <div className="mt-2 text-sm text-amber-600">
                {usersWithoutAppId} users without app_id detected. Use the migration button to fix.
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || isRefetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setAddUserOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>

            <UsersTable
              users={filteredUsers}
              isLoading={isLoading}
              onEditRole={handleEditRole}
              onResetPassword={handleResetPassword}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        {selectedUser && (
          <>
            <UserManageDialog
              user={selectedUser}
              open={manageDialogOpen}
              onOpenChange={setManageDialogOpen}
              onUserUpdated={refetch}
            />
            <UserPasswordResetDialog
              user={selectedUser}
              open={resetPasswordOpen}
              onOpenChange={setResetPasswordOpen}
            />
          </>
        )}

        <AddUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onUserAdded={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
