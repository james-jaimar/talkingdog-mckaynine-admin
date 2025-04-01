
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserAdminTable from "@/components/users/UserAdminTable";
import { Loader2 } from "lucide-react";
import type { User as AdminUser } from "@/components/users/hooks/useUsers";

export default function UserAdmin() {
  const { isAdmin, isLoading: authLoading, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch users directly in the component
  const fetchUsers = async () => {
    try {
      console.log("Fetching users in UserAdmin page");
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      console.log(`Found ${data?.length || 0} profiles:`, data);
      
      // Map to a simpler user structure and mark current user
      const mappedUsers: AdminUser[] = (data || []).map(profile => ({
        id: profile.id,
        email: profile.username || '',
        full_name: profile.full_name || '',
        role: profile.role || 'user',
        created_at: profile.created_at,
        isCurrentUser: profile.id === currentUser?.id
      }));
      
      setUsers(mappedUsers);
      console.log("Users after mapping:", mappedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auth check and redirection
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

  // Fetch users on mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      // Set up periodic refresh
      const interval = setInterval(fetchUsers, 10000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchUsers();
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
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
            <span className="ml-2">Loading users...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error.message}</span>
          </div>
        ) : (
          <UserAdminTable 
            users={users} 
            onRefresh={handleRefresh} 
            currentUserId={currentUser?.id || ''}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
