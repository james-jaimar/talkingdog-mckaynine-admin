
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, UserPlus, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { UserProfile } from "./types/userTypes";
import { AddUserDialog } from "./AddUserDialog";
import { UserManageDialog } from "./UserManageDialog";
import { UserPasswordResetDialog } from "./UserPasswordResetDialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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
  const isMobile = useIsMobile();

  // Filter users by name or email
  const filteredUsers = users.filter(user => {
    const nameMatch = (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase());
    const emailMatch = (user.email?.toLowerCase() || '').includes(filter.toLowerCase());
    return nameMatch || emailMatch;
  });

  console.log("UserAdminTable - Filtered users:", filteredUsers.length);

  // Handle refresh with debounce
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
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 sm:p-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8 w-full"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 justify-end">
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

      {/* Debug information for user visibility issues */}
      {users.length === 1 && (
        <div className="p-2 mb-2 bg-yellow-50 border border-yellow-200 rounded text-sm mx-4 sm:mx-0">
          <p>Debug: Only 1 user found in database ({users[0]?.email})</p>
        </div>
      )}

      {/* Users table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3">User</th>
                {!isMobile && <th className="text-left px-4 py-3">Role</th>}
                {!isMobile && <th className="text-left px-4 py-3">Created</th>}
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isMobile ? 2 : 4} className="text-center py-8 text-gray-500">
                    {users.length === 0 ? "No users found." : "No users match your search."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.id === currentUserId && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                      {isMobile && (
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full inline-block ${getRoleBadgeClass(user.role)}`}>
                            {user.role || "user"}
                          </span>
                        </div>
                      )}
                    </td>
                    {!isMobile && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {user.role || "user"}
                        </span>
                      </td>
                    )}
                    {!isMobile && (
                      <td className="px-4 py-3">
                        {user.created_at ? format(new Date(user.created_at), "PPP") : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      {isMobile ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setResetPasswordOpen(true);
                              }}
                            >
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setManageDialogOpen(true);
                              }}
                            >
                              Edit Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
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
                              setSelectedUser(user);
                              setManageDialogOpen(true);
                            }}
                          >
                            Edit Role
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
