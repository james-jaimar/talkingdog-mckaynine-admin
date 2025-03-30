
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HandlerDetailHeader } from "@/components/handlers/detail/HandlerDetailHeader";
import { HandlerInfo } from "@/components/handlers/detail/HandlerInfo";
import { DogsList } from "@/components/handlers/detail/DogsList";
import { HandlerNotFound } from "@/components/handlers/detail/HandlerNotFound";
import { HandlerDetailSkeleton } from "@/components/handlers/detail/HandlerDetailSkeleton";
import { Helmet } from "react-helmet";

interface Dog {
  id: string;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  notes?: string;
  behavior_notes?: string;
  medical_notes?: string;
  avatar_url?: string;
}

interface Handler {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: string | null;
  created_at: string;
  dogs: Dog[];
}

export default function HandlerDetail() {
  // Fix the param name to match the router's ":id" parameter
  const { id: handlerId } = useParams();
  
  const { data: handler, isLoading, refetch } = useQuery({
    queryKey: ['handler', handlerId],
    queryFn: async () => {
      if (!handlerId) throw new Error("Handler ID is required");
      
      try {
        const { data, error } = await supabase
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
            branch_id,
            created_at,
            dogs (
              id,
              name,
              breed,
              age,
              weight,
              notes,
              behavior_notes,
              medical_notes,
              avatar_url
            )
          `)
          .eq('id', handlerId)
          .single();
        
        if (error) throw error;
        return data as Handler;
      } catch (error) {
        console.error("Error fetching handler:", error);
        return null;
      }
    }
  });

  const handleHandlerUpdated = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>{handler ? `${handler.first_name} ${handler.last_name}` : 'Handler Detail'} - McKaynine Training Centre</title>
      </Helmet>
      <div className="space-y-6 w-full py-6">
        <HandlerDetailHeader 
          isLoading={isLoading} 
          handler={handler} 
          onHandlerUpdated={handleHandlerUpdated} 
        />

        {isLoading ? (
          <HandlerDetailSkeleton />
        ) : handler ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <HandlerInfo handler={handler} />
            <DogsList 
              dogs={handler.dogs} 
              clientId={handler.id}
              onDogsUpdated={handleHandlerUpdated}
            />
            {/* Future components like upcoming classes/bookings can be added here */}
          </div>
        ) : (
          <HandlerNotFound />
        )}
      </div>
    </DashboardLayout>
  );
}
