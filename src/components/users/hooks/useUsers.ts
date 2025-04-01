
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export type User = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  created_at: string;
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
      
      // Query auth.users join with profiles to get combined user data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          role,
          full_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to ensure it matches our User type
      const formattedUsers: User[] = data.map(user => ({
        id: user.id,
        email: user.email || '',
        role: user.role || 'user',
        full_name: user.full_name || '',
        created_at: user.created_at || new Date().toISOString()
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
