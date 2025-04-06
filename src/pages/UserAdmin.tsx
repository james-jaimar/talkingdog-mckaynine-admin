
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import UserAdminTable from "@/components/users/UserAdminTable";
import { Loader2 } from "lucide-react";
import { useFetchUsers } from "@/components/users/hooks/useFetchUsers";

export default function UserAdmin() {
  const { isAdmin, isLoading: authLoading, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use React Query to fetch users instead of direct Supabase queries
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch: refetchUsers 
  } = useFetchUsers();
  
  // Auth check and redirection
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

  // Handle refresh button click
  const handleRefresh = () => {
    refetchUsers();
    toast({
      title: "Refreshed",
      description: "User list has been refreshed.",
    });
  };

  // Loading states
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
    return null; // Already redirected in useEffect
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>User Administration - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">User Administration</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
            <span className="ml-2">Loading users...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong> 
            <span className="block sm:inline">{error instanceof Error ? error.message : 'Failed to load users'}</span>
          </div>
        ) : (
          <UserAdminTable 
            users={users.map(profile => ({
              id: profile.id,
              email: profile.username || '',
              full_name: profile.full_name || '',
              role: profile.role || 'user',
              created_at: profile.created_at,
              isCurrentUser: profile.id === currentUser?.id
            }))} 
            onRefresh={handleRefresh} 
            currentUserId={currentUser?.id || ''}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
