
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Helmet } from "react-helmet";
import { UserTable } from "@/components/users/UserTable";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function UserAdmin() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);

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
