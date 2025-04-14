
import { useState } from "react";
import { Table, TableBody, TableHeader } from "@/components/ui/table";
import { UserTableHeader } from "./components/UserTableHeader";
import { UserRow } from "./components/UserRow";
import { UserTableEmpty } from "./components/UserTableEmpty";
import { UserManageDialog } from "./UserManageDialog";
import { UserPasswordResetDialog } from "./UserPasswordResetDialog";
import { AddUserDialog } from "./AddUserDialog";
import { useUsers } from "./hooks/useUsers";

export default function UserAdminTable() {
  const { users, isLoading, refetchUsers } = useUsers();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // Filter users by name or email
  const filteredUsers = users.filter(user => {
    const nameMatch = (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase());
    const emailMatch = (user.email?.toLowerCase() || '').includes(filter.toLowerCase());
    return nameMatch || emailMatch;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchUsers();
    setIsRefreshing(false);
  };

  const handleManageUser = (user: any) => {
    setSelectedUser(user);
    setManageDialogOpen(true);
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setResetPasswordOpen(true);
    }
  };

  return (
    <div>
      <UserTableHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onAddUser={() => setAddUserOpen(true)}
        filter={filter}
        onFilterChange={setFilter}
      />

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-right px-4 py-3 w-[80px]">Actions</th>
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
              <UserRow
                key={user.id}
                user={user}
                onEditRole={(userId, role) => {
                  const user = users.find(u => u.id === userId);
                  if (user) {
                    setSelectedUser(user);
                    setManageDialogOpen(true);
                  }
                }}
                onResetPassword={handleResetPassword}
              />
            ))}
          </TableBody>
        </Table>
      </div>

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
            open={resetPasswordOpen}
            onOpenChange={setResetPasswordOpen}
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
