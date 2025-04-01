
import { useState } from "react";
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
import { format } from "date-fns";
import { Search, RefreshCw, Key, UserCog } from "lucide-react";
import { UserManageDialog } from "./UserManageDialog";
import { UserPasswordResetDialog } from "./UserPasswordResetDialog";
import { AddUserDialog } from "./AddUserDialog";

// Simple type definition
type User = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  isCurrentUser: boolean;
};

interface UserAdminTableProps {
  users: User[];
  onRefresh: () => void;
  currentUserId: string;
}

export default function UserAdminTable({ users, onRefresh, currentUserId }: UserAdminTableProps) {
  const [filter, setFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter users by name or email
  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
      user.email?.toLowerCase().includes(filter.toLowerCase())
  );

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500); // Ensure spinner shows for at least 500ms
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
          <AddUserDialog onUserAdded={onRefresh} />
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
                    {users.length === 0 ? "No users found." : "No users match your search."}
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
          onUserUpdated={onRefresh}
        />
      )}
    </Card>
  );
}
