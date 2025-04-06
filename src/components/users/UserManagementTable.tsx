
import { useState } from "react";
import { Table, TableBody, TableHeader } from "@/components/ui/table";
import { UserTableHeader } from "./components/UserTableHeader";
import { UserTableRow } from "./components/UserTableRow";
import { UserTableEmpty } from "./components/UserTableEmpty";
import { UserManageDialog } from "./UserManageDialog";
import { UserPasswordResetDialog } from "./UserPasswordResetDialog";
import { AddUserDialog } from "./AddUserDialog";
import { useUsers, User } from "./hooks/useUsers";

export function UserManagementTable() {
  const { users, isLoading, refetchUsers } = useUsers();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // Filter users by name or email
  const filteredUsers = users.filter(
    (user) =>
      (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchUsers();
    setIsRefreshing(false);
  };

  const handleManageUser = (user: User) => {
    setSelectedUser(user);
    setManageDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <UserTableHeader 
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onAddUser={() => setAddUserOpen(true)}
        filter={filter}
        onFilterChange={setFilter}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right w-[80px]">Actions</th>
            </tr>
          </TableHeader>
          <TableBody>
            <UserTableEmpty
              users={users}
              filteredUsers={filteredUsers}
              filter={filter}
              isLoading={isLoading}
            />

            {!isLoading && filteredUsers.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                onManageUser={handleManageUser}
                onResetPassword={handleResetPassword}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {selectedUser && (
        <>
          <UserManageDialog 
            user={selectedUser}
            open={manageDialogOpen}
            onOpenChange={setManageDialogOpen}
            onUserUpdated={refetchUsers}
          />
          <UserPasswordResetDialog
            user={selectedUser}
            open={resetPasswordDialogOpen}
            onOpenChange={setResetPasswordDialogOpen}
          />
        </>
      )}
      
      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserAdded={refetchUsers}
      />
    </div>
  );
}
