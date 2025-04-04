
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientDog {
  id: string;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  date_of_birth?: string;
  notes?: string;
  behavior_notes?: string;
  medical_notes?: string;
  avatar_url?: string;
}

export interface ClientData {
  id: string;
  first_name: string;
  last_name: string; // We'll keep this in the interface but it will effectively be unused
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  dogs: ClientDog[];
}

export function useCustomerProfileData() {
  const { user } = useAuth();
  
  const { 
    data: clientData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        // First, check if a client record exists with this email
        const { data: clientByEmail, error: clientEmailError } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postal_code,
            notes,
            dogs (
              id,
              name,
              breed,
              age,
              weight,
              date_of_birth,
              notes,
              behavior_notes,
              medical_notes,
              avatar_url
            )
          `)
          .eq('email', user.email)
          .single();
          
        if (!clientEmailError && clientByEmail) {
          console.log("Found client by email:", clientByEmail);
          return clientByEmail as ClientData;
        }
        
        if (clientEmailError && clientEmailError.code !== 'PGRST116') {
          // PGRST116 means no rows returned, any other error is unexpected
          console.error("Error fetching client by email:", clientEmailError);
          throw clientEmailError;
        }
        
        // If no client found by email, check if user exists in profiles table with role = 'handler'
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }
        
        // If user is a handler but no client record exists yet, create one
        if (userProfile?.role === 'handler') {
          console.log("User is a handler, creating client record");
          
          // Extract name from user metadata if available
          const fullName = user.user_metadata?.full_name || '';
          
          // Create new client record for this handler
          const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert({
              email: user.email,
              first_name: fullName, // Store full name in first_name field
              last_name: "" // Leave last_name empty
            })
            .select(`
              id,
              first_name,
              last_name,
              email,
              phone,
              address,
              city,
              postal_code,
              notes,
              dogs:dogs (
                id,
                name,
                breed,
                age,
                weight,
                date_of_birth,
                notes,
                behavior_notes,
                medical_notes,
                avatar_url
              )
            `)
            .single();
            
          if (insertError) {
            console.error("Error creating client record:", insertError);
            throw insertError;
          }
          
          return newClient as ClientData;
        }
        
        console.warn("User is not a handler and no client record exists");
        toast.error("Your account is not set up as a handler");
        return null;
      } catch (error) {
        console.error("Error in client data fetch:", error);
        toast.error("Failed to load profile data");
        return null;
      }
    },
    enabled: !!user
  });

  const handleProfileUpdated = () => {
    refetch();
    toast.success("Profile updated successfully");
  };

  return {
    clientData,
    isLoading,
    error,
    refetch,
    handleProfileUpdated
  };
}
