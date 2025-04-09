
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import UserAdminTable from "@/components/users/UserAdminTable";
import { useFetchUsers } from "@/components/users/hooks/useFetchUsers";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function UserAdmin() {
  // Auth and navigation hooks
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Fetch users data
  const { 
    data: users = [], 
    isLoading: usersLoading, 
    error, 
    refetch 
  } = useFetchUsers();
  
  console.log("UserAdmin - Current user:", user?.id);
  console.log("UserAdmin - Fetched users count:", users.length);
  console.log("UserAdmin - First few users:", users.slice(0, 3));
  
  // Access check - redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [authLoading, isAdmin, navigate, toast]);

  // Debug function to directly check database
  const runDiagnostics = async () => {
    try {
      // Try a direct count query
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Try to get all profiles directly
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      // Check auth user 
      const { data: authData } = await supabase.auth.getUser();
      
      // Get session
      const { data: sessionData } = await supabase.auth.getSession();
      
      setDebugInfo({
        timestamp: new Date().toISOString(),
        profilesCount: count,
        countError: countError?.message,
        profilesFound: allProfiles?.length,
        profilesError: profilesError?.message,
        currentAuthUser: authData?.user?.id,
        sessionExists: Boolean(sessionData?.session),
        firstProfile: allProfiles?.[0]
      });
    } catch (err) {
      console.error("Diagnostics error:", err);
      setDebugInfo({ error: String(err) });
    }
  };

  // Loading state
  if (authLoading || usersLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
            <span className="ml-2">Loading user data...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
            <h2 className="text-xl font-medium text-red-800 mb-2">Error Loading Users</h2>
            <p className="text-red-700">{(error as Error).message}</p>
            <button 
              onClick={() => refetch()} 
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Access denied - will redirect in useEffect
  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">User Administration</h1>
        <p className="text-gray-500 mb-6">Manage user accounts and permissions.</p>
        
        {users.length === 1 && (
          <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800">
                Only one user profile was found. This might indicate a data access issue.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runDiagnostics}
                className="mt-2"
              >
                Run Diagnostics
              </Button>
            </div>
          </div>
        )}
        
        {debugInfo && (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
            <h3 className="font-medium mb-2">Diagnostics Results:</h3>
            <pre className="text-xs overflow-auto p-2 bg-white border rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>
              Manage user access and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserAdminTable 
              users={users} 
              onRefresh={refetch} 
              currentUserId={user?.id || ''} 
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
