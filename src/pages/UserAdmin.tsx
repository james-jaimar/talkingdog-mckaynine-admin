
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { UserTable } from "@/components/users/UserTable";

export default function UserAdmin() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Simple auth redirection
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isLoading, isAdmin, navigate, toast]);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">User Administration</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-gray-600 mt-2">Checking permissions...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null; // Already redirected in useEffect
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">User Administration</h1>
        <UserTable />
      </div>
    </DashboardLayout>
  );
}
