
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

  // Fetch clients with limit to reduce data transfer
  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, address, city, postal_code, branch_id, notes, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as Client[];
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
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
