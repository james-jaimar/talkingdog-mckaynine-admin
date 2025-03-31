
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Class } from "@/components/classes/types/class";
import { Helmet } from "react-helmet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddHandlerToClassModal } from "@/components/classes/handlers/AddHandlerToClassModal";

export default function ClassHandlers() {
  const { classId } = useParams<{ classId: string }>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch class data
  const { data: classData, isLoading: isClassLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      if (!classId) return null;
      
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();
      
      if (error) throw error;
      return data as Class;
    },
    enabled: !!classId,
  });

  // Fetch handlers for this class
  const { data: handlers, isLoading: isHandlersLoading, refetch } = useQuery({
    queryKey: ["class-handlers", classId],
    queryFn: async () => {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          dogs:dog_id (
            id,
            name,
            breed
          ),
          class_schedules:class_schedule_id (
            id,
            class_id
          )
        `)
        .eq('class_schedules.class_id', classId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });

  const isLoading = isClassLoading || isHandlersLoading;

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <p>Class not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>{classData.name} Handlers - McKaynine Training Centre</title>
      </Helmet>
      <div className="w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{classData.name} - Handlers</h1>
            <p className="text-muted-foreground">Manage handlers enrolled in this class</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Handler to Class
          </Button>
        </div>

        {handlers && handlers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handler</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Dog</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {handlers.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.clients?.first_name} {booking.clients?.last_name}
                  </TableCell>
                  <TableCell>{booking.clients?.email}</TableCell>
                  <TableCell>{booking.clients?.phone}</TableCell>
                  <TableCell>{booking.dogs?.name}</TableCell>
                  <TableCell>{booking.dogs?.breed}</TableCell>
                  <TableCell>{booking.status}</TableCell>
                  <TableCell>{booking.payment_status}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p className="text-muted-foreground">No handlers enrolled in this class yet.</p>
          </div>
        )}

        <AddHandlerToClassModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          classId={classId || ''}
          classData={classData}
          onSuccess={handleAddSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
