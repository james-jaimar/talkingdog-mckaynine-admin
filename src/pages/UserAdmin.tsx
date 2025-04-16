
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserManagement } from "@/components/users/hooks/useUserManagement";
import { UserListHeader } from "@/components/users/components/UserListHeader";
import { UserManageDialog } from "@/components/users/UserManageDialog";
import { UserPasswordResetDialog } from "@/components/users/UserPasswordResetDialog";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { UsersTable } from "@/components/users/components/UsersTable";
import { UserProfile } from "@/components/users/types/userTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MigrateUsersButton } from "@/components/users/components/MigrateUsersButton";

export default function UserAdmin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // User management state and handlers
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(true);

  const {
    users,
    isLoading,
    refetch,
    updateRole
  } = useUserManagement({
    includeAllUsers: showAllUsers
  });

  // Handle authentication
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

  const handleEditRole = (userId: string, currentRole: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setManageDialogOpen(true);
    }
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setResetPasswordOpen(true);
    }
  };

  // Count users with and without app_id
  const usersWithAppId = users.filter(user => user.app_id).length;
  const usersWithoutAppId = users.length - usersWithAppId;

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
                  <MigrateUsersButton onComplete={refetch} />
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
            <UserListHeader
              onRefresh={handleRefresh}
              onAddUser={() => setAddUserOpen(true)}
              isRefreshing={isRefreshing}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            <UsersTable
              users={users}
              filteredUsers={filteredUsers}
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
