
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useFetchUsers } from "@/components/users/hooks/useFetchUsers";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function UserAdmin() {
  // Auth and navigation hooks
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for direct database diagnostics
  const [directDbUsers, setDirectDbUsers] = useState<any[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  
  // Fetch users data with simplified hook
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useFetchUsers();
  
  console.log("UserAdmin - Users count:", users.length);
  console.log("UserAdmin - Current user:", user?.id);
  
  // Access check
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
            <span className="ml-2">Checking permissions...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!isAdmin) {
    // Redirect non-admins
    navigate("/dashboard");
    return null;
  }

  // Run direct database query for diagnostics
  const runDirectDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      // Get direct DB access to profiles
      console.log("Running direct DB diagnostics");
      
      // Use Postgres function to get all profiles
      const { data: dbUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Direct DB query error:", error);
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Direct DB query returned:", dbUsers?.length || 0, "users");
      setDirectDbUsers(dbUsers || []);
      
    } catch (e) {
      console.error("Error in diagnostics:", e);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
            <h2 className="text-xl font-medium text-red-800 mb-2">Error Loading Users</h2>
            <p className="text-red-700">{(error as Error).message}</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                className="border-red-300 text-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={runDirectDiagnostics}
                variant="outline"
                className="border-amber-300 text-amber-700"
              >
                Run Database Diagnostics
              </Button>
            </div>
          </div>
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
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Administration</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              onClick={runDirectDiagnostics}
              disabled={isRunningDiagnostics}
              className="border-amber-300 text-amber-700"
            >
              {isRunningDiagnostics ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Database Diagnostics
            </Button>
          </div>
        </div>
        
        {users.length <= 1 && (
          <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Limited User Data</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  Only {users.length} user(s) were retrieved from the database. This might indicate a permission issue.
                </p>
                <p className="text-sm text-yellow-700">
                  Current user ID: <code className="bg-yellow-100 px-1 py-0.5 rounded">{user?.id}</code>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {directDbUsers.length > 0 && (
          <Card className="mb-6 border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="text-amber-800">Database Diagnostic Results</CardTitle>
              <CardDescription>
                Direct database query returned {directDbUsers.length} users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b">ID</th>
                      <th className="text-left p-2 border-b">Username</th>
                      <th className="text-left p-2 border-b">Role</th>
                      <th className="text-left p-2 border-b">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directDbUsers.map((dbUser, index) => (
                      <tr key={dbUser.id} className={index % 2 === 0 ? 'bg-amber-50' : ''}>
                        <td className="p-2 font-mono text-xs">{dbUser.id}</td>
                        <td className="p-2">{dbUser.username}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                            {dbUser.role || 'user'}
                          </span>
                        </td>
                        <td className="p-2">{new Date(dbUser.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-amber-50 text-amber-700 text-sm">
              Compare this data with the users displayed in the table below
            </CardFooter>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : (
              <SimpleUserTable users={users} currentUserId={user?.id || ''} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Simple inline table component to avoid dependencies
function SimpleUserTable({ users, currentUserId }: { users: any[], currentUserId: string }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found in the database.
      </div>
    );
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3">User</th>
            <th className="text-left px-4 py-3">Role</th>
            <th className="text-left px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="px-4 py-3">
                <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                {user.id === currentUserId && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-4 py-3">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  let className = "px-2 py-1 text-xs rounded-full ";
  
  switch (role) {
    case "admin":
      className += "bg-blue-100 text-blue-800";
      break;
    case "trainer":
      className += "bg-green-100 text-green-800";
      break;
    case "handler":
      className += "bg-orange-100 text-orange-800";
      break;
    default:
      className += "bg-gray-100 text-gray-800";
  }
  
  return (
    <span className={className}>
      {role || "user"}
    </span>
  );
}
