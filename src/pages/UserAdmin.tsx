
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, RefreshCw, Info, Bug } from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFetchUsers } from "@/components/users/hooks/useFetchUsers";
import { Button } from "@/components/ui/button";
import UserAdminTable from "@/components/users/UserAdminTable";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function UserAdmin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [diagnosticUsers, setDiagnosticUsers] = useState<any[]>([]);
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const isMobile = useIsMobile();
  
  // Fetch users data
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useFetchUsers();
  
  console.log("UserAdmin - Users count:", users.length);
  
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

  // Run diagnostic with direct fetch to compare results
  const runDiagnostic = async () => {
    setIsDiagnosticLoading(true);
    try {
      // Log authentication details
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Diagnostic: Current user ID:", session?.user?.id);
      console.log("Diagnostic: User is admin:", isAdmin);
      
      // Try direct query with service function
      const { data, error } = await supabase.functions.invoke("get-users", {
        method: "GET"
      });
      
      if (error) {
        console.error("Diagnostic: Error invoking edge function:", error);
        toast({
          variant: "destructive",
          title: "Edge Function Error",
          description: error.message,
        });
      } else if (data) {
        console.log("Diagnostic: Edge function returned", data.length, "users");
        setDiagnosticUsers(data || []);
        toast({
          title: "Diagnostic Results",
          description: `Edge function found ${data.length || 0} users`,
        });
      }
    } catch (error) {
      console.error("Diagnostic failed:", error);
      toast({
        variant: "destructive",
        title: "Diagnostic Failed",
        description: error.message,
      });
    } finally {
      setIsDiagnosticLoading(false);
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
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="border-red-300 text-red-700 mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
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
      
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">User Administration</h1>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              size={isMobile ? "sm" : "default"}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Users
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={runDiagnostic}
              disabled={isDiagnosticLoading}
              size={isMobile ? "sm" : "default"}
            >
              <Info className="h-4 w-4 mr-2" />
              {isMobile ? "Diagnostic" : "Run Diagnostic"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              size={isMobile ? "sm" : "default"}
            >
              <Bug className="h-4 w-4 mr-2" />
              {showDebugInfo ? (isMobile ? "Hide" : "Hide Debug") : (isMobile ? "Debug" : "Show Debug")}
            </Button>
          </div>
        </div>
        
        {/* Debug information panel */}
        {showDebugInfo && (
          <div className="mb-6 p-4 border border-indigo-200 bg-indigo-50 rounded-md overflow-auto">
            <h3 className="font-medium text-indigo-900 mb-2">Debug Information</h3>
            <ul className="text-xs space-y-1 text-indigo-800">
              <li><strong>Current User ID:</strong> {user?.id || 'Not logged in'}</li>
              <li><strong>Admin Status:</strong> {isAdmin ? 'Yes' : 'No'}</li>
              <li><strong>Edge Function:</strong> get-users (Configured: Yes)</li>
              <li><strong>Users from Hook:</strong> {users.length}</li>
              <li><strong>Diagnostic Users:</strong> {diagnosticUsers.length}</li>
            </ul>
          </div>
        )}
        
        {users.length <= 1 && (
          <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800">Limited User Data</h3>
                <p className="text-sm text-yellow-700">
                  Only {users.length} user(s) were retrieved. This might indicate a permission or configuration issue.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {diagnosticUsers.length > 0 && (
          <div className="mb-6 p-4 border border-blue-300 bg-blue-50 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">Diagnostic Results</h3>
                <p className="text-sm text-blue-700">
                  Edge function returned {diagnosticUsers.length} users. Hook returned {users.length} users.
                </p>
                <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded overflow-auto max-h-32">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(diagnosticUsers.slice(0, 5).map(u => ({id: u.id, email: u.username, role: u.role})), null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : (
              <UserAdminTable 
                users={users} 
                onRefresh={() => refetch()}
                currentUserId={user?.id || ''}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
