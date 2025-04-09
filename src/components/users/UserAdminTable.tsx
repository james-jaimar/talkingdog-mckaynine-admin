
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, RefreshCw, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "./types/userTypes";
import { AddUserDialog } from "./AddUserDialog";
import { UserManageDialog } from "./UserManageDialog";
import { UserPasswordResetDialog } from "./UserPasswordResetDialog";

interface UserAdminTableProps {
  users: UserProfile[];
  onRefresh: () => void;
  currentUserId: string;
}

export default function UserAdminTable({ users, onRefresh, currentUserId }: UserAdminTableProps) {
  const [filter, setFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  // For debugging
  useEffect(() => {
    console.log("UserAdminTable - Component mounted or users changed");
    console.log("UserAdminTable - Received users array:", users);
    console.log(`UserAdminTable - Users array length: ${users.length}`);
    console.log("UserAdminTable - First few users:", users.slice(0, 3));
    console.log("UserAdminTable - Users array is array?", Array.isArray(users));
    
    // Check if users have all required properties
    if (users.length > 0) {
      const firstUser = users[0];
      console.log("UserAdminTable - Sample user object:", firstUser);
      console.log("UserAdminTable - User has id?", Boolean(firstUser.id));
      console.log("UserAdminTable - User has email?", Boolean(firstUser.email));
      console.log("UserAdminTable - User has role?", Boolean(firstUser.role));
    }
  }, [users]);

  // Filter users by name or email
  const filteredUsers = users.filter(user => {
    const nameMatch = (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase());
    const emailMatch = (user.email?.toLowerCase() || '').includes(filter.toLowerCase());
    return nameMatch || emailMatch;
  });

  console.log("UserAdminTable - Filtered users:", filteredUsers.length);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log("UserAdminTable - Refreshing user data...");
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
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
    <div>
      <div className="flex justify-between items-center mb-4">
        {/* Search and action buttons */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8 w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
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
          <Button 
            size="sm" 
            onClick={() => setAddUserOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        </div>
      </div>

      {/* Debug information */}
      {users.length === 1 && (
        <div className="p-2 mb-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p>Debug: Only 1 user found in database ({users[0]?.email})</p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {users.length === 0 ? "No users found." : "No users match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    {user.id === currentUserId && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeClass(user.role)}>
                      {user.role || "user"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), "PPP") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log("Reset password clicked for user:", user.id);
                          setSelectedUser(user);
                          setResetPasswordOpen(true);
                        }}
                      >
                        Reset Password
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log("Edit role clicked for user:", user.id);
                          setSelectedUser(user);
                          setManageDialogOpen(true);
                        }}
                      >
                        Edit Role
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddUserDialog 
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserAdded={onRefresh}
      />

      {selectedUser && (
        <>
          <UserManageDialog 
            user={selectedUser}
            open={manageDialogOpen}
            onOpenChange={setManageDialogOpen}
            onUserUpdated={onRefresh}
          />
          
          <UserPasswordResetDialog 
            user={selectedUser}
            open={resetPasswordOpen}
            onOpenChange={setResetPasswordOpen}
          />
        </>
      )}
    </div>
  );
}
