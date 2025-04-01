
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trainer } from "@/components/trainers/types/trainer";

export default function TrainerReferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReplacement, setSelectedReplacement] = useState<Record<string, string>>({});

  // Get list of trainers
  const { data: trainers, isLoading: isLoadingTrainers } = useQuery({
    queryKey: ['trainers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('*');
      
      if (error) throw error;
      return data as Trainer[];
    }
  });

  // Get trainer references in class_schedules
  const { data: trainerReferences, isLoading: isLoadingReferences } = useQuery({
    queryKey: ['trainer-references'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          trainer_id,
          classes:class_id (
            name,
            level
          )
        `)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Reassign trainer mutation
  const { mutate: reassignTrainer, isPending: isReassigning } = useMutation({
    mutationFn: async ({ scheduleId, trainerId }: { scheduleId: string, trainerId: string | null }) => {
      const { error } = await supabase
        .from('class_schedules')
        .update({ trainer_id: trainerId })
        .eq('id', scheduleId);
      
      if (error) throw error;
      return { scheduleId, trainerId };
    },
    onSuccess: () => {
      toast({
        title: "Trainer reassigned",
        description: "Class schedule has been updated with the new trainer.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['trainer-references'] });
    },
    onError: (error) => {
      toast({
        title: "Error reassigning trainer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calculate trainer usage count
  const trainerUsage = trainerReferences?.reduce((acc, ref) => {
    const id = ref.trainer_id;
    if (!acc[id]) acc[id] = 0;
    acc[id]++;
    return acc;
  }, {} as Record<string, number>) || {};

  // Get trainer name from ID
  const getTrainerName = (id: string) => {
    const trainer = trainers?.find(t => t.id === id);
    return trainer ? `${trainer.first_name} ${trainer.last_name}` : "Unknown Trainer";
  };

  // Handle reassignment
  const handleReassign = (scheduleId: string) => {
    const newTrainerIdOrNone = selectedReplacement[scheduleId];
    if (!newTrainerIdOrNone) {
      toast({
        title: "No trainer selected",
        description: "Please select a replacement trainer or 'None'.",
        variant: "destructive",
      });
      return;
    }

    // If "none" is selected, set trainer_id to null
    const newTrainerId = newTrainerIdOrNone === "none" ? null : newTrainerIdOrNone;
    reassignTrainer({ scheduleId, trainerId: newTrainerId });
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Trainer References - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="flex flex-col space-y-6 w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Trainer References</h1>
        </div>

        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Trainer cleanup required</AlertTitle>
          <AlertDescription>
            Before deleting trainers, you need to reassign any classes they are scheduled to teach.
            Use this page to identify and reassign classes from trainers you want to remove.
          </AlertDescription>
        </Alert>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle>Trainer Usage Summary</CardTitle>
            <CardDescription>
              View how many class schedules reference each trainer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTrainers || isLoadingReferences ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {trainers?.map(trainer => (
                  <Card key={trainer.id} className={
                    trainerUsage[trainer.id] ? "border-amber-300" : "border-green-300"
                  }>
                    <CardContent className="p-4">
                      <div className="font-medium">{trainer.first_name} {trainer.last_name}</div>
                      <div className="text-sm text-muted-foreground mb-2">{trainer.email}</div>
                      {trainerUsage[trainer.id] ? (
                        <div className="text-amber-600 font-medium">
                          Referenced in {trainerUsage[trainer.id]} class schedule(s)
                        </div>
                      ) : (
                        <div className="text-green-600 font-medium">
                          Not referenced (safe to delete)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle>Class Schedules with Trainer References</CardTitle>
            <CardDescription>
              Reassign trainers to classes before deleting trainer profiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReferences ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trainerReferences && trainerReferences.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Current Trainer</TableHead>
                    <TableHead>Reassign To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainerReferences.map((reference) => (
                    <TableRow key={reference.id}>
                      <TableCell>
                        <div className="font-medium">
                          {reference.classes?.name || "Unknown Class"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reference.classes?.level || ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(reference.start_time).toLocaleDateString()}{' '}
                        {new Date(reference.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(reference.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getTrainerName(reference.trainer_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectedReplacement[reference.id] || ""}
                          onValueChange={(value) => setSelectedReplacement(prev => ({
                            ...prev,
                            [reference.id]: value
                          }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a trainer" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Add a "None" option at the beginning */}
                            <SelectItem value="none" className="text-gray-500">
                              None (Remove trainer)
                            </SelectItem>
                            
                            {trainers?.filter(t => t.id !== reference.trainer_id).map(trainer => (
                              <SelectItem key={trainer.id} value={trainer.id}>
                                {trainer.first_name} {trainer.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline"
                          onClick={() => handleReassign(reference.id)}
                          disabled={!selectedReplacement[reference.id] || isReassigning}
                        >
                          {isReassigning ? 
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                            null
                          }
                          Reassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No class schedules with trainer references found. All trainers can be safely deleted.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
