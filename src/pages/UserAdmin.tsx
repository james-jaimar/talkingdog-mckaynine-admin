
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFetchUsers } from "@/components/users/hooks/useFetchUsers";
import { Button } from "@/components/ui/button";
import UserAdminTable from "@/components/users/UserAdminTable";

export default function UserAdmin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
      
      <div className="container mx-auto py-6">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Administration</h1>
          
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Users
          </Button>
        </div>
        
        {users.length <= 1 && (
          <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Limited User Data</h3>
                <p className="text-sm text-yellow-700">
                  Only {users.length} user(s) were retrieved from the database. This might indicate a permission issue.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
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
