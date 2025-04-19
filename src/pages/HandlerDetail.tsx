import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Plus, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { HandlerInvoices } from "@/components/handlers/detail/HandlerInvoices";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
  FormDescription
} from "@/components/ui/form";
import { EditDogForm } from "@/components/handlers/detail/EditDogForm";
import { EditDogModal } from "@/components/handlers/detail/EditDogModal";

// Define Zod schema for handler profile form
const handlerProfileSchema = z.object({
  first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
});

// Define Zod schema for dog form
const dogSchema = z.object({
  name: z.string().min(2, {
    message: "Dog name must be at least 2 characters.",
  }),
  breed: z.string().min(2, {
    message: "Breed must be at least 2 characters.",
  }),
  age: z.number().optional(),
  weight: z.number().optional(),
  notes: z.string().optional(),
  behavior_notes: z.string().optional(),
  medical_notes: z.string().optional(),
});

// Define types for handler and dog based on the schemas
type HandlerProfileFormValues = z.infer<typeof handlerProfileSchema>;
type DogFormValues = z.infer<typeof dogSchema>;

// Handler detail header component
function HandlerDetailHeader({ clientData, isLoading, onEditHandler }: { clientData: any, isLoading: boolean, onEditHandler: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <div>
        <Button variant="ghost" onClick={() => navigate('/handlers')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Handlers
        </Button>
        <h1 className="text-2xl font-bold">
          {isLoading ? "Loading..." : `${clientData?.first_name || 'New'} ${clientData?.last_name || 'Handler'}`}
        </h1>
      </div>
      <div>
        <Button variant="outline" onClick={onEditHandler}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Handler
        </Button>
      </div>
    </div>
  );
}

// Handler info card component
function HandlerInfo({ clientData, isLoading }: { clientData: any, isLoading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Handler Information</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
            <span>Loading handler info...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{clientData?.first_name?.[0]}{clientData?.last_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{clientData?.first_name} {clientData?.last_name}</p>
                <p className="text-sm text-muted-foreground">{clientData?.email}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {clientData?.address && <p>{clientData.address}</p>}
              {clientData?.city && <p>{clientData.city}, {clientData.postal_code}</p>}
              {clientData?.phone && <p>Phone: {clientData.phone}</p>}
            </div>
            {clientData?.notes && (
              <div className="text-sm text-gray-700 mt-2">
                <p className="font-semibold">Notes:</p>
                <p>{clientData.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Handler communications card component
function HandlerCommunications({ clientData }: { clientData: any }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communications</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <Button variant="outline" onClick={() => navigate(`/customer/messages?client=${clientData?.id}`)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Send Message
        </Button>
      </CardContent>
    </Card>
  );
}

// Dogs list component
function DogsList({ clientId, clientData, isLoading, onAddDog, onEditDog }: { clientId: string, clientData: any, isLoading: boolean, onAddDog: () => void, onEditDog: (dog: any) => void }) {
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Dogs</CardTitle>
        <Button size="sm" onClick={onAddDog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dog
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
            <span>Loading dogs...</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {clientData?.dogs?.map((dog: any) => (
              <div key={dog.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium leading-none">{dog.name}</p>
                  <p className="text-sm text-muted-foreground">{dog.breed}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onEditDog(dog)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {!clientData?.dogs?.length && (
              <div className="py-4 text-center text-muted-foreground">No dogs added yet.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HandlerDetail() {
  const { handlerId } = useParams<{ handlerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editHandlerOpen, setEditHandlerOpen] = useState(false);
  const [addDogOpen, setAddDogOpen] = useState(false);
  const [editDogOpen, setEditDogOpen] = useState(false);
  const [selectedDog, setSelectedDog] = useState(null);

  // Fetch client data - making sure we're using the correct parameter
  const { data: clientData, isLoading, refetch } = useQuery({
    queryKey: ['client', handlerId],
    queryFn: async () => {
      console.log("Fetching handler with ID:", handlerId);
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *, 
          dogs(*)
        `)
        .eq('id', handlerId)
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
    enabled: !!handlerId,
  });

  // Handler profile form setup
  const handlerForm = useForm<HandlerProfileFormValues>({
    resolver: zodResolver(handlerProfileSchema),
    defaultValues: {
      first_name: clientData?.first_name || "",
      last_name: clientData?.last_name || "",
      email: clientData?.email || "",
      phone: clientData?.phone || "",
      address: clientData?.address || "",
      city: clientData?.city || "",
      postal_code: clientData?.postal_code || "",
      notes: clientData?.notes || "",
    },
    mode: "onChange",
  });

  // Dog form setup
  const dogForm = useForm<DogFormValues>({
    resolver: zodResolver(dogSchema),
    defaultValues: {
      name: selectedDog?.name || "",
      breed: selectedDog?.breed || "",
      age: selectedDog?.age || undefined,
      weight: selectedDog?.weight || undefined,
      notes: selectedDog?.notes || "",
      behavior_notes: selectedDog?.behavior_notes || "",
      medical_notes: selectedDog?.medical_notes || "",
    },
    mode: "onChange",
  });

  // Update default values when clientData changes
  useEffect(() => {
    handlerForm.reset({
      first_name: clientData?.first_name || "",
      last_name: clientData?.last_name || "",
      email: clientData?.email || "",
      phone: clientData?.phone || "",
      address: clientData?.address || "",
      city: clientData?.city || "",
      postal_code: clientData?.postal_code || "",
      notes: clientData?.notes || "",
    });
  }, [clientData, handlerForm]);

  // Update dog form default values when selectedDog changes
  useEffect(() => {
    dogForm.reset({
      name: selectedDog?.name || "",
      breed: selectedDog?.breed || "",
      age: selectedDog?.age || undefined,
      weight: selectedDog?.weight || undefined,
      notes: selectedDog?.notes || "",
      behavior_notes: selectedDog?.behavior_notes || "",
      medical_notes: selectedDog?.medical_notes || "",
    });
  }, [selectedDog, dogForm]);

  // Open edit handler modal
  const openEditHandlerModal = () => {
    setEditHandlerOpen(true);
  };

  // Close edit handler modal
  const closeEditHandlerModal = () => {
    setEditHandlerOpen(false);
  };

  // Handle handler profile update
  const handleHandlerProfileUpdate = async (values: HandlerProfileFormValues) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(values)
        .eq('id', handlerId);

      if (error) {
        toast({
          title: "Error updating handler",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Handler updated",
        description: "Handler profile has been updated successfully",
      });
      closeEditHandlerModal();
      refetch();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Open add dog modal
  const openAddDogModal = () => {
    setSelectedDog(null);
    dogForm.reset();
    setAddDogOpen(true);
  };

  // Close add dog modal
  const closeAddDogModal = () => {
    setAddDogOpen(false);
  };

  // Open edit dog modal
  const openEditDogModal = (dog: any) => {
    setSelectedDog(dog);
    setEditDogOpen(true);
  };

  // Close edit dog modal
  const closeEditDogModal = () => {
    setEditDogOpen(false);
  };

  // Handle dog creation/update
  const handleDogSubmit = async (values: DogFormValues) => {
    try {
      if (selectedDog) {
        // Update existing dog
        const { error } = await supabase
          .from('dogs')
          .update({
            name: values.name,
            breed: values.breed, // Make sure breed is always provided
            age: values.age,
            weight: values.weight,
            notes: values.notes,
            behavior_notes: values.behavior_notes,
            medical_notes: values.medical_notes,
          })
          .eq('id', selectedDog.id);

        if (error) {
          toast({
            title: "Error updating dog",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Dog updated",
          description: "Dog profile has been updated successfully",
        });
        closeEditDogModal();
      } else {
        // Create new dog
        const { error } = await supabase
          .from('dogs')
          .insert({
            client_id: handlerId,
            name: values.name,
            breed: values.breed, // Make sure breed is always provided
            age: values.age,
            weight: values.weight, 
            notes: values.notes,
            behavior_notes: values.behavior_notes, 
            medical_notes: values.medical_notes,
          });

        if (error) {
          toast({
            title: "Error creating dog",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Dog created",
          description: "New dog profile has been created successfully",
        });
        closeAddDogModal();
      }

      refetch();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Handler Details - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        {/* Handler detail header with navigation */}
        <HandlerDetailHeader 
          clientData={clientData} 
          isLoading={isLoading} 
          onEditHandler={openEditHandlerModal}
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
          
          {/* Right column - Dogs and classes */}
          <div className="md:col-span-2 space-y-6">
            {/* Invoices - Added this new component */}
            {clientData && (
              <HandlerInvoices clientData={clientData} />
            )}
            
            {/* Dogs list */}
            <DogsList 
              clientId={handlerId} 
              clientData={clientData}
              isLoading={isLoading} 
              onAddDog={openAddDogModal}
              onEditDog={openEditDogModal}
            />
          </div>
        </div>

        {/* Edit Handler Modal */}
        <Dialog open={editHandlerOpen} onOpenChange={closeEditHandlerModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Handler Profile</DialogTitle>
              <DialogDescription>
                Make changes to the handler's personal information here.
              </DialogDescription>
            </DialogHeader>
            <Form {...handlerForm}>
              <form onSubmit={handlerForm.handleSubmit(handleHandlerProfileUpdate)} className="space-y-4">
                <FormField
                  control={handlerForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={handlerForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={handlerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={handlerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={handlerForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={handlerForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={handlerForm.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={handlerForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeEditHandlerModal}>
                    Cancel
                  </Button>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Dog Modal using EditDogModal component */}
        {handlerId && (
          <EditDogModal 
            clientId={handlerId}
            isNew={true}
            onSuccess={() => {
              closeAddDogModal();
              refetch();
            }}
          />
        )}

        {/* Edit Dog Modal using EditDogModal component */}
        {selectedDog && handlerId && (
          <EditDogModal
            dog={selectedDog}
            clientId={handlerId}
            isNew={false}
            onSuccess={() => {
              closeEditDogModal();
              refetch();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
