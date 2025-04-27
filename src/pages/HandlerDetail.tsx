
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
import { Client, Dog } from "@/hooks/useClientsData";

// Define a type for the consent status values
type ConsentStatus = 'yes' | 'no' | 'not_marked';

// Define a type for the handler/client data
interface HandlerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  branch_id?: string;
  uses_whatsapp_status: ConsentStatus;
  social_media_consent_status: ConsentStatus;
  created_at: string;
  updated_at: string;
  dogs?: Array<{
    id: string;
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
    date_of_birth?: string;
    created_at?: string;
    updated_at?: string;
  }>;
}

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

      // Ensure consent statuses are properly typed
      const typedData: HandlerData = {
        ...data,
        uses_whatsapp_status: (data.uses_whatsapp_status as ConsentStatus) || 'not_marked',
        social_media_consent_status: (data.social_media_consent_status as ConsentStatus) || 'not_marked'
      };

      return typedData;
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

  // Convert HandlerData to Client type for HandlerInvoices component
  // Ensure all required properties are provided with default values if needed
  // and properly transform the dogs array to match the Dog type
  const clientForInvoices: Client = {
    ...clientData,
    phone: clientData.phone || '', // Ensure phone is not optional
    address: clientData.address || '', // Ensure address is not optional
    city: clientData.city || '', // Ensure city is not optional
    postal_code: clientData.postal_code || '', // Ensure postal_code is not optional
    branch_id: clientData.branch_id || null, // Ensure branch_id is set correctly
    notes: clientData.notes || null, // Set notes to null if not provided
    // Transform dogs array to match the Dog type required by Client interface
    dogs: clientData.dogs ? clientData.dogs.map(dog => ({
      ...dog,
      client_id: clientData.id, // Add required client_id
      created_at: clientData.created_at, // Use client's created_at as fallback
      updated_at: clientData.updated_at, // Use client's updated_at as fallback
    })) as Dog[] : undefined,
  };

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
              handler={clientData} 
            />
            
            {/* Communications card */}
            <HandlerCommunications 
              clientId={clientData.id}
              clientName={`${clientData.first_name} ${clientData.last_name || ''}`}
            />
          </div>
          
          {/* Right column - Dogs and invoices */}
          <div className="md:col-span-2 space-y-6">
            {/* Invoices */}
            {clientData && (
              <HandlerInvoices clientData={clientForInvoices} />
            )}
            
            {/* Dogs list */}
            <DogsList 
              clientId={id || ''}
              dogs={clientData.dogs || []}
              onDogsUpdated={handleHandlerUpdated}
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
