import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HandlerDetailHeader } from "@/components/handlers/detail/HandlerDetailHeader";
import { HandlerInfo } from "@/components/handlers/detail/HandlerInfo";
import { DogsList } from "@/components/handlers/detail/DogsList";
import { HandlerNotFound } from "@/components/handlers/detail/HandlerNotFound";
import { HandlerDetailSkeleton } from "@/components/handlers/detail/HandlerDetailSkeleton";

export default function HandlerDetail() {
  const { handlerId } = useParams();
  
  const { data: handler, isLoading } = useQuery({
    queryKey: ['handler', handlerId],
    queryFn: async () => {
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
      return data;
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <HandlerDetailHeader isLoading={isLoading} handler={handler} />

        {isLoading ? (
          <HandlerDetailSkeleton />
        ) : handler ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <HandlerInfo handler={handler} />
            <DogsList dogs={handler.dogs} />
            {/* Future components like upcoming classes/bookings can be added here */}
          </div>
        ) : (
          <HandlerNotFound />
        )}
      </div>
    </DashboardLayout>
  );
}
