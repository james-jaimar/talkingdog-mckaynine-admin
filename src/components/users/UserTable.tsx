
import { useState, useEffect } from "react";
import { useUsersData } from "./hooks/useUsersData";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { AddUserDialog } from "./AddUserDialog";
import { UserTableHeader } from "./components/UserTableHeader";
import { UserTableRow } from "./components/UserTableRow";
import { UserTableEmpty } from "./components/UserTableEmpty";
import { UserRoleDialog } from "./components/UserRoleDialog";
import { UserProfile } from "./types/userTypes";

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
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  // Filter users by name or email
  const filteredUsers = users.filter(
    (user) =>
      (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  // Fetch users on component mount
  useEffect(() => {
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
          <div className="text-red-500 font-semibold">Error Loading Users</div>
          <p className="text-sm text-muted-foreground">
            There was a problem loading the user data.
          </p>
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
      <CardHeader className="pb-0">
        <UserTableHeader
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onAddUser={() => setAddUserDialogOpen(true)}
          filter={filter}
          onFilterChange={setFilter}
        />
      </CardHeader>
      <CardContent>
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
              <UserTableEmpty
                users={users}
                filteredUsers={filteredUsers}
                filter={filter}
              />
              {filteredUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isLoadingTrainers={isLoadingTrainers}
                  trainers={trainers}
                  onEditUser={setEditingUser}
                  onResetPassword={handleResetPassword}
                  onLinkTrainer={linkTrainerToUser}
                  onUnlinkTrainer={unlinkTrainerFromUser}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* User role dialog */}
      <UserRoleDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onRoleChange={handleRoleChange}
        isUpdating={isUpdating}
      />

      {/* Add User Dialog */}
      <AddUserDialog 
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onUserAdded={refetchUsers}
      />

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
