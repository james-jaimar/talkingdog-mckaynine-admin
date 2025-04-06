
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export type User = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  created_at: string;
  isCurrentUser?: boolean;
  username?: string;
  avatar_url?: string | null;
};

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current user for marking in the UI
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Query profiles table to get user data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          role,
          full_name,
          created_at,
          avatar_url
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to ensure it matches our User type
      const formattedUsers: User[] = data.map(user => ({
        id: user.id,
        email: user.username || '',  // Email is stored in username field
        username: user.username || '',
        role: user.role || 'user',
        full_name: user.full_name || '',
        created_at: user.created_at || new Date().toISOString(),
        avatar_url: user.avatar_url,
        isCurrentUser: user.id === currentUser?.id // Add the isCurrentUser flag
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error : new Error('Failed to fetch users'));
      toast({
        title: "Error loading users",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    error,
    refetchUsers: fetchUsers
  };
}
