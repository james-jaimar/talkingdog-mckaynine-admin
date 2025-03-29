
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { EditTrainerModal } from "./EditTrainerModal";
import { Trainer } from "./types/trainer";

export function TrainersTable() {
  const { data: trainers, isLoading, error } = useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const { data: trainersData, error: trainersError } = await supabase
        .from("trainers")
        .select("*");
      
      if (trainersError) throw trainersError;
      
      // Fetch all branches for mapping
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("id, name");
        
      if (branchesError) throw branchesError;
      
      // Map trainers data to match our Trainer interface
      return trainersData.map((trainer) => {
        // Handle the migration from branch_id to branch_ids by checking if either property exists
        // TypeScript doesn't know about branch_ids yet, so we need to use a type assertion
        const trainerAny = trainer as any;
        const branchIds = trainerAny.branch_ids || 
                         (trainer.branch_id ? [trainer.branch_id] : []);
        
        // Get branch names from branch IDs
        const branchNames = branchIds
          .map(id => branchesData.find(branch => branch.id === id)?.name || "Unknown");
        
        return {
          ...trainer,
          branch_ids: branchIds,
          branch_names: branchNames
        } as Trainer;
      });
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
            <TableHead>Branches</TableHead>
            <TableHead>Specialties</TableHead>
            <TableHead>Actions</TableHead>
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
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {trainer.branch_names && trainer.branch_names.length > 0 ? (
                      trainer.branch_names.map((branchName, index) => (
                        <Badge key={index} variant="outline" className="bg-mckaynine-50 text-mckaynine-700 border-mckaynine-200">
                          {branchName}
                        </Badge>
                      ))
                    ) : (
                      "Unassigned"
                    )}
                  </div>
                </TableCell>
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
                <TableCell>
                  <div className="flex items-center">
                    <EditTrainerModal trainer={trainer} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No trainers found. Add your first trainer to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
