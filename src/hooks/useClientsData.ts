
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  branch_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  dogs?: Dog[];
}

export interface Dog {
  id: string;
  name: string;
  breed: string;
  client_id: string;
  age?: number | null;
  weight?: number | null;
  avatar_url?: string | null;
  notes?: string | null;
  behavior_notes?: string | null;
  medical_notes?: string | null;
  date_of_birth?: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientsData() {
  const queryClient = useQueryClient();

  // Fetch all clients
  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch a single client by ID
  const fetchClientById = async (clientId: string) => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *, 
        dogs(*)
      `)
      .eq('id', clientId)
      .single();
    
    if (error) throw error;
    return data as Client;
  };

  // Hook for getting client by ID
  const useClientById = (clientId: string | undefined) => {
    return useQuery({
      queryKey: ['client', clientId],
      queryFn: () => fetchClientById(clientId as string),
      enabled: !!clientId,
    });
  };

  return {
    clients,
    isLoading,
    error,
    refetch,
    fetchClientById,
    useClientById
  };
}
