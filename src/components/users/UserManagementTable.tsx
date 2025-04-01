
import { useState } from "react";
import { User, useUsers } from "./hooks/useUsers";
import { format } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, RefreshCw, Key, UserCog } from "lucide-react";
import { AddUserDialog } from "./AddUserDialog";
import { UserPasswordResetDialog } from "./UserPasswordResetDialog";
import { UserManageDialog } from "./UserManageDialog";

export function UserManagementTable() {
  // Get user data and functions from the hook
  const {
    filteredUsers,
    filter,
    setFilter,
    isLoading,
    error,
    refetch
  } = useUsers();

  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Open password reset dialog
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsPasswordResetOpen(true);
  };

  // Open manage user dialog
  const handleManageUser = (user: User) => {
    setSelectedUser(user);
    setIsManageDialogOpen(true);
  };

  // Get role badge style
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-blue-100 text-blue-800";
      case "trainer": return "bg-green-100 text-green-800";
      case "handler": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-mckaynine-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">
          {error instanceof Error ? error.message : "Failed to load users"}
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
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
          <AddUserDialog onUserAdded={refetch} />
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
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {filter ? "No users match your search." : "No users found."}
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
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                        {user.role || "user"}
                      </span>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageUser(user)}
                        >
                          <UserCog className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
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
      {selectedUser && (
        <UserPasswordResetDialog 
          user={selectedUser}
          open={isPasswordResetOpen}
          onOpenChange={setIsPasswordResetOpen}
        />
      )}

      {/* Manage User Dialog */}
      {selectedUser && (
        <UserManageDialog 
          user={selectedUser}
          open={isManageDialogOpen}
          onOpenChange={setIsManageDialogOpen}
          onUserUpdated={refetch}
        />
      )}
    </Card>
  );
}
