
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { EditHandlerModal } from "@/components/handlers/EditHandlerModal";
import { HandlerDetailHeader } from "@/components/handlers/detail/HandlerDetailHeader";
import { HandlerInfo } from "@/components/handlers/detail/HandlerInfo";
import { HandlerCommunications } from "@/components/handlers/detail/HandlerCommunications";
import { DogsList } from "@/components/handlers/detail/DogsList";
import { HandlerInvoices } from "@/components/handlers/detail/HandlerInvoices";
import { EditDogModal } from "@/components/handlers/detail/EditDogModal";
import { HandlerDetailSkeleton } from "@/components/handlers/detail/HandlerDetailSkeleton";
import { HandlerNotFound } from "@/components/handlers/detail/HandlerNotFound";
import { useToast } from "@/components/ui/use-toast";

export default function HandlerDetail() {
  // Change from handlerId to id to match the route parameter
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addDogOpen, setAddDogOpen] = useState(false);
  const [editDogOpen, setEditDogOpen] = useState(false);
  const [selectedDog, setSelectedDog] = useState(null);

  // Fetch client data using the id parameter
  const { data: clientData, isLoading, refetch } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      console.log("Fetching handler with ID:", id);
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *, 
          dogs(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Error fetching handler",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

  // Handler updated callback
  const handleHandlerUpdated = () => {
    console.log("Handler updated, refetching data");
    refetch();
  };

  // Open add dog modal
  const openAddDogModal = () => {
    setSelectedDog(null);
    setAddDogOpen(true);
  };

  // Open edit dog modal
  const openEditDogModal = (dog: any) => {
    setSelectedDog(dog);
    setEditDogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <HandlerDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (!clientData) {
    return (
      <DashboardLayout>
        <HandlerNotFound />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Handler Details - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        {/* Handler detail header with navigation */}
        <HandlerDetailHeader 
          isLoading={isLoading} 
          handler={clientData}
          onHandlerUpdated={handleHandlerUpdated}
        />
        
        {/* Main content section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Handler info */}
          <div className="space-y-6">
            {/* Handler info card */}
            <HandlerInfo 
              clientData={clientData} 
              isLoading={isLoading} 
            />
            
            {/* Communications card */}
            <HandlerCommunications 
              clientData={clientData} 
            />
          </div>
          
          {/* Right column - Dogs and invoices */}
          <div className="md:col-span-2 space-y-6">
            {/* Invoices */}
            {clientData && (
              <HandlerInvoices clientData={clientData} />
            )}
            
            {/* Dogs list */}
            <DogsList 
              clientId={id} 
              clientData={clientData}
              isLoading={isLoading} 
              onAddDog={openAddDogModal}
              onEditDog={openEditDogModal}
            />
          </div>
        </div>

        {/* Add Dog Modal */}
        {id && (
          <EditDogModal 
            clientId={id}
            isNew={true}
            open={addDogOpen}
            onOpenChange={setAddDogOpen}
            onSuccess={() => {
              setAddDogOpen(false);
              refetch();
            }}
          />
        )}

        {/* Edit Dog Modal */}
        {selectedDog && id && (
          <EditDogModal
            dog={selectedDog}
            clientId={id}
            isNew={false}
            open={editDogOpen}
            onOpenChange={setEditDogOpen}
            onSuccess={() => {
              setEditDogOpen(false);
              refetch();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
