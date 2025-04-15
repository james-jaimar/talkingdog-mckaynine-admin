
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditTrainerModal } from "./EditTrainerModal";
import { useTrainersList } from "./hooks/useTrainersList";
import { Loader2 } from "lucide-react";

export function TrainersTable() {
  const { data: trainers, isLoading } = useTrainersList();
  
  if (isLoading) {
    return <div className="text-center p-6">Loading trainers...</div>;
  }
  
  if (!trainers || trainers.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50">
        <p className="text-muted-foreground">No trainers found. Add trainers by assigning the trainer role in User Administration.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trainers?.map((trainer) => (
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
              <div className="flex items-center gap-2">
                <EditTrainerModal trainer={trainer} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
