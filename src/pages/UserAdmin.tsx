
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Helmet } from "react-helmet";
import { UserTable } from "@/components/users/UserTable";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useUsersData } from "@/components/users/hooks/useUsersData";

export default function UserAdmin() {
  const { user, isAdmin, isLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const { setUserAsAdmin } = useUsersData();
  const [adminSetupComplete, setAdminSetupComplete] = useState(false);

  // Check if user is admin, if not redirect
  useEffect(() => {
    if (!isLoading) {
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
      } else {
        setPageLoading(false);
      }
    }
  }, [isAdmin, isLoading, navigate, toast]);

  // Set ady@talkingdog.co.za as admin - only run once
  useEffect(() => {
    const setupAdminUser = async () => {
      if (!pageLoading && isAdmin && !adminSetupComplete) {
        console.log("Setting up admin user - once only");
        
        // Email of the user we want to make an admin
        const adminEmail = "ady@talkingdog.co.za";
        
        try {
          await setUserAsAdmin(adminEmail);
          setAdminSetupComplete(true);
        } catch (error) {
          console.error("Error setting up admin user:", error);
          setAdminSetupComplete(true); // Still mark as complete to prevent retries
        }
      }
    };
    
    setupAdminUser();
  }, [pageLoading, isAdmin, setUserAsAdmin, adminSetupComplete]);

  if (isLoading || pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
          <span className="ml-2 text-lg text-mckaynine-600">Loading...</span>
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
        <h1 className="text-2xl font-bold mb-6">User Administration</h1>
        <UserTable />
      </div>
    </DashboardLayout>
  );
}
