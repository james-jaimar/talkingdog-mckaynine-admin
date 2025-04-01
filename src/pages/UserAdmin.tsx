
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, UserCog, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// UI Components
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, 
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Types
type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  isCurrentUser?: boolean;
};

export default function UserAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Simple auth redirection
  if (!isLoading && !isAdmin) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this page.",
      variant: "destructive",
    });
    navigate("/");
    return null;
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setError(null);
      
      console.log("Fetching users directly in UserAdmin component");
      
      // Get current user for marking in the UI
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("Current user ID:", currentUser?.id);
      
      // Simple fetch of all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }
      
      console.log("Raw profile data:", profiles);
      
      if (!profiles || profiles.length === 0) {
        console.log("No profiles found");
        setUsers([]);
        return;
      }
      
      // Map to user profiles with current user marked
      const mappedUsers = profiles.map(profile => ({
        ...profile,
        isCurrentUser: currentUser?.id === profile.id
      }));
      
      console.log("Mapped users:", mappedUsers);
      
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Error in fetchUsers:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!isLoading && isAdmin) {
      fetchUsers();
    }
  }, [isLoading, isAdmin]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  // Handle role change
  const handleRoleChange = async (role: string) => {
    if (!editingUser) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', editingUser.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "User updated",
        description: "User role has been updated successfully.",
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === editingUser.id ? { ...u, role } : u
        )
      );
      
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(
    (user) =>
      (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
          <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">User Administration</h1>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Users ({users?.length || 0})</CardTitle>
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
            
            {isLoadingUsers ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-red-500 border border-red-200 rounded-md">
                <p className="font-semibold">Error loading users:</p>
                <p>{error.message}</p>
              </div>
            ) : (
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
                    {!users || users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found in database.
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users match your search.
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
                            <div className="flex justify-end gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
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
                                    </DialogFooter>
                                  </DialogContent>
                                )}
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
