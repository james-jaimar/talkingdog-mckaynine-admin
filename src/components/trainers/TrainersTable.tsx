
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditTrainerModal } from "./EditTrainerModal";
import { useBranch } from "@/context/BranchContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trainer } from "./types/trainer";
import { MapPin } from "lucide-react";

export function TrainersTable() {
  const { currentBranch } = useBranch();

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers', currentBranch?.id],
    queryFn: async () => {
      let query = supabase
        .from('trainers')
        .select(`
          *,
          branches:branch_id (
            name
          )
        `);
      
      // Filter by branch if one is selected
      if (currentBranch) {
        query = query.eq('branch_id', currentBranch.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (Trainer & { branches: { name: string } | null })[];
    },
    enabled: !!currentBranch // Only run query when a branch is selected
  });
  
  if (isLoading) {
    return <div className="text-center p-6">Loading trainers...</div>;
  }
  
  if (!trainers || trainers.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50">
        <p className="text-muted-foreground">No trainers found. Add your first trainer to get started.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Specialties</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trainers.map((trainer) => (
          <TableRow key={trainer.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  {trainer.avatar_url ? (
                    <AvatarImage src={trainer.avatar_url} alt={`${trainer.first_name} ${trainer.last_name}`} />
                  ) : null}
                  <AvatarFallback>
                    {trainer.first_name.charAt(0)}{trainer.last_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{trainer.first_name} {trainer.last_name}</div>
                  {trainer.bio && <div className="text-xs text-muted-foreground line-clamp-1">{trainer.bio}</div>}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="text-sm">{trainer.email}</div>
                {trainer.phone && <div className="text-sm text-muted-foreground">{trainer.phone}</div>}
              </div>
            </TableCell>
            <TableCell>
              {trainer.branches ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{trainer.branches.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {trainer.specialties && trainer.specialties.length > 0 ? (
                  trainer.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="bg-mckaynine-50 text-mckaynine-700">
                      {specialty}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">None specified</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <EditTrainerModal trainer={trainer} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
