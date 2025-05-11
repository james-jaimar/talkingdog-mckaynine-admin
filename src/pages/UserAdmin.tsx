
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { UserAdminPanel } from "@/components/users/UserAdmin";
import { useEffect } from "react";

export default function UserAdmin() {
  const { isAdmin, isPlatformAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin && !isPlatformAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, isPlatformAdmin, authLoading, navigate]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Checking permissions...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin && !isPlatformAdmin) {
    return null; // Will be redirected
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">User Administration</h1>
          <p className="text-muted-foreground mt-1">
            {isPlatformAdmin 
              ? "Manage all user accounts and assign roles (Platform Admin view)" 
              : "Manage user accounts and assign roles for your branch"}
          </p>
        </div>
        
        {isPlatformAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Platform Admin Access</CardTitle>
              <CardDescription>
                You have elevated privileges to manage all branches and users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                As a Platform Admin, you can assign branch ownership and create other platform admins. 
                Use this power responsibly as it grants full system access.
              </p>
            </CardContent>
          </Card>
        )}
        
        <UserAdminPanel />
      </div>
    </DashboardLayout>
  );
}
