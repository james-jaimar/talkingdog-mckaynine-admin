
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import UserAdminTable from "@/components/users/UserAdminTable";
import { useFetchUsers } from "@/components/users/hooks/useFetchUsers";

export default function UserAdmin() {
  // Auth and navigation hooks
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch users data
  const { data: users = [], isLoading: usersLoading, refetch } = useFetchUsers();
  
  console.log("UserAdmin - Current user:", user?.id);
  console.log("UserAdmin - Fetched users count:", users.length);
  console.log("UserAdmin - Users data:", users);
  
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
