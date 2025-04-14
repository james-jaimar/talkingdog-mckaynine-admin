
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, RefreshCw, Bug, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetchUsers } from "@/components/users/hooks/useFetchUsers";
import { Button } from "@/components/ui/button";
import UserAdminTable from "@/components/users/UserAdminTable";
import { useIsMobile } from "@/hooks/useIsMobile";
import { UserDiagnosticPanel } from "@/components/users/components/UserDiagnosticPanel";
import { UserDebugPanel } from "@/components/users/components/UserDebugPanel";
import { UserErrorState } from "@/components/users/components/UserErrorState";

export default function UserAdmin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [diagnosticUsers, setDiagnosticUsers] = useState<any[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const isMobile = useIsMobile();
  
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useFetchUsers();
  
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
    navigate("/dashboard");
    return null;
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <UserErrorState error={error as Error} onRetry={() => refetch()} />
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
              variant="outline"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              size={isMobile ? "sm" : "default"}
            >
              <Bug className="h-4 w-4 mr-2" />
              {showDebugInfo ? (isMobile ? "Hide" : "Hide Debug") : (isMobile ? "Debug" : "Show Debug")}
            </Button>
          </div>
        </div>
        
        {showDebugInfo && (
          <UserDebugPanel
            userId={user?.id}
            isAdmin={isAdmin}
            usersCount={users.length}
            diagnosticUsersCount={diagnosticUsers.length}
          />
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
        
        <UserDiagnosticPanel
          isAdmin={isAdmin}
          diagnosticUsers={diagnosticUsers}
          usersCount={users.length}
        />
        
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
