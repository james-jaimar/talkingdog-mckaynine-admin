
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { UserTable } from "@/components/users/UserTable";
import { UserRoleDialog } from "@/components/users/UserRoleDialog";
import { UserPasswordResetDialog } from "@/components/users/UserPasswordResetDialog";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { MigrateUsersButton } from "@/components/users/MigrateUsersButton";
import { useUsers, User } from "@/hooks/useUsers";
import { APP_ID } from "@/constants/app";

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

  // Fetch users with our simplified hook
  const {
    users,
    isLoading,
    refetch,
    usersNeedingMigration
  } = useUsers({
    showAllUsers
  });

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

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration</title>
      </Helmet>

      <div className="container mx-auto py-6 px-4">
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
                  <MigrateUsersButton 
                    onComplete={handleRefresh} 
                    userCount={usersNeedingMigration} 
                  />
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
            
            <UserTable
              users={users}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onAddUser={() => setAddUserOpen(true)}
              onEditRole={handleEditRole}
              onResetPassword={handleResetPassword}
            />
          </CardContent>
        </Card>
        
        {/* Dialogs */}
        <UserRoleDialog
          user={selectedUser}
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          onSuccess={refetch}
        />
        
        <UserPasswordResetDialog
          user={selectedUser}
          open={passwordResetOpen}
          onOpenChange={setPasswordResetOpen}
        />
        
        <AddUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onSuccess={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
