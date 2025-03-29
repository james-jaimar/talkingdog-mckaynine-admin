
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  branch_id: string | null;
  branch_name?: string;
  specialties: string[] | null;
  avatar_url: string | null;
}

export function TrainersTable() {
  const { data: trainers, isLoading, error } = useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainers")
        .select(`
          *,
          branches:branch_id (name)
        `);
      
      if (error) throw error;
      
      // Add branch_name for easier access in the table
      return data.map((trainer) => ({
        ...trainer,
        branch_name: trainer.branches?.name || "Unassigned"
      }));
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-6">Loading trainers...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">Error loading trainers: {String(error)}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trainer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Specialties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainers && trainers.length > 0 ? (
            trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {trainer.avatar_url ? (
                        <AvatarImage src={trainer.avatar_url} alt={`${trainer.first_name} ${trainer.last_name}`} />
                      ) : null}
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {trainer.first_name} {trainer.last_name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{trainer.email}</TableCell>
                <TableCell>{trainer.phone || "—"}</TableCell>
                <TableCell>{trainer.branch_name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {trainer.specialties && trainer.specialties.length > 0 ? (
                      trainer.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="bg-mckaynine-50 text-mckaynine-700 border-mckaynine-200">
                          {specialty}
                        </Badge>
                      ))
                    ) : (
                      "—"
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No trainers found. Add your first trainer to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
