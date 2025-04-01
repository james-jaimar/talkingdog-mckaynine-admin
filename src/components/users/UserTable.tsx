
import { useState } from "react";
import { useUsersData, UserProfile } from "./hooks/useUsersData";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Loader2, Search, UserCog } from "lucide-react";

export function UserTable() {
  const {
    users,
    isLoading,
    error,
    updateUserRole,
    isUpdating,
  } = useUsersData();

  const [filter, setFilter] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Filter users by name or email
  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
      user.username?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleRoleChange = (role: string) => {
    if (editingUser) {
      updateUserRole({ userId: editingUser.id, role });
      setEditingUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Users</CardTitle>
          <CardDescription>
            There was a problem loading the user data. Please try again later.
          </CardDescription>
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
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage user accounts and access roles.
        </CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
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
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || "—"}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === "admin" 
                          ? "bg-blue-100 text-blue-800" 
                          : user.role === "trainer" 
                            ? "bg-green-100 text-green-800" 
                            : user.role === "handler"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.role || "user"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.created_at 
                        ? format(new Date(user.created_at), "PPP") 
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <UserCog className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        {editingUser && editingUser.id === user.id && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Update role and permissions for {editingUser.full_name || editingUser.username}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    Role
                                  </label>
                                  <Select 
                                    defaultValue={editingUser.role} 
                                    onValueChange={handleRoleChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="trainer">Trainer</SelectItem>
                                      <SelectItem value="handler">Handler</SelectItem>
                                      <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    User ID
                                  </label>
                                  <Input 
                                    value={editingUser.id} 
                                    disabled 
                                    className="bg-muted"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    This is the user's unique identifier
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setEditingUser(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                disabled={isUpdating} 
                                onClick={() => {
                                  // Dialog will close automatically when the select changes
                                  // But we provide this button for UX purposes
                                  setEditingUser(null);
                                }}
                              >
                                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
