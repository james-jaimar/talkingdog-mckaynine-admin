
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth";
import { useNavigate } from "react-router-dom";
import { UserManagementTable } from "@/components/users/UserManagementTable";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function UserManagement() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auth check and redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate, toast]);

  // Loading state
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">User Administration</h1>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
            <span className="ml-2">Checking permissions...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in the useEffect
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">User Administration</h1>
        <UserManagementTable />
      </div>
    </DashboardLayout>
  );
}
