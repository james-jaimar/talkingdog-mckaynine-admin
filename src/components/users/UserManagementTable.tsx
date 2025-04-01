
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  UserPlus, 
  RefreshCw, 
  Key, 
  UserCog, 
  Loader2 
} from "lucide-react";
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

  // Helper to determine the badge color based on user role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'trainer':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'handler':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-medium">Users</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <span className="mt-2 block text-sm text-muted-foreground">
                    Loading users...
                  </span>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'No name'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getRoleBadgeColor(user.role)}
                    >
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleManageUser(user)}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user)}
                        >
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
