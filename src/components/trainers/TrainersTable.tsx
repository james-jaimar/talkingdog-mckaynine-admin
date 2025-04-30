
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditTrainerModal } from "./EditTrainerModal";
import { useTrainersList } from "./hooks/useTrainersList";
import { Trainer } from "./types/trainer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TrainersTable() {
  const { data: trainers = [], isLoading, refetch } = useTrainersList();
  const [isRefetching, setIsRefetching] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName?.[0] || "") + (lastName?.[0] || "");
  };

  const handleRefresh = async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefetching}
        >
          {(isLoading || isRefetching) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh List
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p>Loading trainers...</p>
        </div>
      ) : trainers.length === 0 ? (
        <div className="text-center py-6 border rounded-md bg-gray-50">
          <p className="text-gray-500">No trainers found.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Branch</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.map((trainer, index) => (
                <TableRow key={trainer.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-200"}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 bg-mckaynine-100 text-mckaynine-800">
                        {trainer.avatar_url ? (
                          <AvatarImage src={trainer.avatar_url} alt={`${trainer.first_name} ${trainer.last_name}`} />
                        ) : (
                          <AvatarFallback>
                            {getInitials(trainer.first_name, trainer.last_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {trainer.first_name} {trainer.last_name}
                        </div>
                        <div className="flex gap-1">
                          {trainer.user_id && (
                            <Badge variant="outline" className="text-xs">User</Badge>
                          )}
                          {trainer.specialties && trainer.specialties.length > 0 && (
                            <Badge variant="outline" className="text-xs">{trainer.specialties.length} specialties</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="truncate max-w-[200px]">{trainer.email}</div>
                      {trainer.phone && (
                        <div className="text-sm text-gray-500">
                          {trainer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {trainer.branch_names && trainer.branch_names.length > 0 ? (
                      <Badge variant="secondary">
                        {trainer.branch_names[0]}
                      </Badge>
                    ) : trainer.branch_id ? (
                      <Badge variant="secondary">
                        Assigned
                      </Badge>
                    ) : (
                      <span className="text-gray-500 text-sm">No branch assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditTrainerModal trainer={trainer} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
