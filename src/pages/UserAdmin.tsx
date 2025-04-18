
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { UserAdminPanel } from "@/components/users/UserAdmin";

export default function UserAdmin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

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

  if (!isAdmin) {
    navigate("/dashboard");
    return null;
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
            Manage user accounts and their roles
          </p>
        </div>
        
        <UserAdminPanel />
      </div>
    </DashboardLayout>
  );
}
