
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditTrainerModal } from "./EditTrainerModal";
import { useTrainersList } from "./hooks/useTrainersList";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export function TrainersTable() {
  const { data: trainers, isLoading, error, refetch } = useTrainersList();
  
  const handleRefresh = () => {
    refetch();
  };
  
  if (isLoading) {
    return <div className="text-center p-6">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
      <p>Loading trainers...</p>
    </div>;
  }
  
  if (error) {
    return (
      <div className="text-center p-8 border rounded-md bg-red-50">
        <p className="text-red-600 mb-4">Error loading trainers: {error.message}</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }
  
  if (!trainers || trainers.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50">
        <p className="text-muted-foreground mb-4">No trainers found. Add trainers by assigning the trainer role in User Administration.</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh List
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </div>
      
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
    </div>
  );
}
