
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PlusCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExistingHandlersListProps {
  searchQuery: string;
  onSelect: (handlerId: string, dogId: string) => void;
  classId: string;
  isProcessing: boolean;
}

export function ExistingHandlersList({ searchQuery, onSelect, classId, isProcessing }: ExistingHandlersListProps) {
  const [expandedHandlers, setExpandedHandlers] = useState<string[]>([]);
  const [processingDogId, setProcessingDogId] = useState<string | null>(null);

  // Fetch handlers that aren't already in this class
  const { data: handlers, isLoading, error } = useQuery({
    queryKey: ["available-handlers", classId, searchQuery],
    queryFn: async () => {
      console.log("Fetching available handlers for class:", classId);
      
      try {
        // Get existing bookings for this class to exclude those handlers/dogs
        const { data: existingBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('client_id, dog_id')
          .eq('class_schedule_id', classId);
        
        if (bookingsError) {
          console.error("Error fetching existing bookings:", bookingsError);
          throw bookingsError;
        }
        
        console.log("Existing bookings for class:", existingBookings);
        
        // Create lookup map of existing client-dog combinations
        const existingClientDogPairs = new Set();
        existingBookings?.forEach(booking => {
          existingClientDogPairs.add(`${booking.client_id}-${booking.dog_id}`);
        });
        
        // Then fetch all handlers with their dogs
        let query = supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            dogs (
              id,
              name,
              breed
            )
          `);
        
        // Add search filter if searchQuery exists
        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
          );
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching available handlers:", error);
          throw error;
        }
        
        // Filter out handlers who have ALL their dogs already in the class
        const filteredData = data?.filter(client => {
          // If client has no dogs, they can't be added to a class
          if (!client.dogs || client.dogs.length === 0) return false;
          
          // Check if at least one dog is not yet enrolled
          return client.dogs.some(dog => !existingClientDogPairs.has(`${client.id}-${dog.id}`));
        }) || [];
        
        // For each handler, filter their dogs to only show those not already enrolled
        return filteredData.map(client => ({
          ...client,
          dogs: client.dogs.filter(dog => !existingClientDogPairs.has(`${client.id}-${dog.id}`))
        }));
      } catch (err) {
        console.error("Error in fetchAvailableHandlers:", err);
        throw err;
      }
    }
  });

  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Error in ExistingHandlersList:", error);
    }
  }, [error]);

  const toggleHandler = (handlerId: string) => {
    setExpandedHandlers(prev => 
      prev.includes(handlerId) 
        ? prev.filter(id => id !== handlerId) 
        : [...prev, handlerId]
    );
  };

  const handleSelect = (handlerId: string, dogId: string) => {
    setProcessingDogId(dogId);
    onSelect(handlerId, dogId);
  };

  // Reset processing dog ID when global processing state changes
  useEffect(() => {
    if (!isProcessing) {
      setProcessingDogId(null);
    }
  }, [isProcessing]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border rounded-md">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-md border border-red-200">
        <p className="text-red-700">Error loading handlers.</p>
        <p className="text-sm mt-2 text-red-600">
          Please try refreshing the page or contact support.
        </p>
      </div>
    );
  }

  if (!handlers || handlers.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md border">
        <p className="text-muted-foreground">No handlers available to add to this class.</p>
        <p className="text-sm mt-2">All handlers have already been added or no handlers match your search.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Handler Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {handlers.map(handler => (
            <TableRow 
              key={handler.id}
              className={expandedHandlers.includes(handler.id) ? "bg-slate-50" : ""}
            >
              <TableCell>
                <button 
                  onClick={() => toggleHandler(handler.id)}
                  className="text-left font-medium hover:underline"
                >
                  {handler.first_name} {handler.last_name}
                </button>
              </TableCell>
              <TableCell>{handler.email}</TableCell>
              <TableCell>{handler.phone || "-"}</TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleHandler(handler.id)}
                >
                  {expandedHandlers.includes(handler.id) ? "Hide Dogs" : "Show Dogs"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Show dogs for expanded handlers */}
      {handlers.map(handler => {
        if (!expandedHandlers.includes(handler.id)) return null;
        
        return (
          <div key={`dogs-${handler.id}`} className="p-4 bg-slate-50 border-t">
            <h4 className="text-sm font-medium mb-2">Dogs belonging to {handler.first_name} {handler.last_name}:</h4>
            {handler.dogs && handler.dogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {handler.dogs.map((dog: any) => (
                  <div key={dog.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
                    <div>
                      <div className="font-medium">{dog.name}</div>
                      <div className="text-sm text-muted-foreground">{dog.breed}</div>
                    </div>
                    <Button
                      variant="mckaynine"
                      size="sm"
                      onClick={() => handleSelect(handler.id, dog.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing && processingDogId === dog.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <PlusCircle className="h-4 w-4 mr-1" />
                      )}
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No dogs available to add for this handler.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
