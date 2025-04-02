
import { useState } from "react";
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
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExistingHandlersListProps {
  searchQuery: string;
  onSelect: (handlerId: string, dogId: string) => void;
  classId: string;
  isProcessing: boolean;
}

export function ExistingHandlersList({ searchQuery, onSelect, classId, isProcessing }: ExistingHandlersListProps) {
  const [expandedHandlers, setExpandedHandlers] = useState<string[]>([]);

  // Fetch handlers that aren't already in this class
  const { data: handlers, isLoading } = useQuery({
    queryKey: ["available-handlers", classId, searchQuery],
    queryFn: async () => {
      // First get existing bookings for this class to exclude those handlers
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('client_id')
        .eq('class_schedule_id', classId);
      
      const existingClientIds = existingBookings?.map(booking => booking.client_id) || [];
      
      // Then fetch handlers that aren't already in this class
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
      
      // Exclude handlers already in the class
      if (existingClientIds.length > 0) {
        query = query.not('id', 'in', `(${existingClientIds.join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });

  const toggleHandler = (handlerId: string) => {
    setExpandedHandlers(prev => 
      prev.includes(handlerId) 
        ? prev.filter(id => id !== handlerId) 
        : [...prev, handlerId]
    );
  };

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
                      onClick={() => onSelect(handler.id, dog.id)}
                      disabled={isProcessing}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No dogs found for this handler.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
