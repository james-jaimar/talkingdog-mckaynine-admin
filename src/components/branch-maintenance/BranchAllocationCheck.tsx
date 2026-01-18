
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function BranchAllocationCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [stats, setStats] = useState<null | {
    unassignedHandlers: number;
    unassignedClasses: number;
    unassignedTrainers: number;
  }>(null);
  const [isFixing, setIsFixing] = useState(false);
  const { currentBranch } = useBranch();
  const { toast } = useToast();

  const checkAllocation = async () => {
    if (!currentBranch) {
      toast({
        title: "No branch selected",
        description: "Please select a branch first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChecking(true);
      
      // Check unassigned handlers - those with no entry in client_branches
      const { data: allClients } = await supabase
        .from('clients')
        .select('id');
      
      const { data: clientsWithBranches } = await supabase
        .from('client_branches')
        .select('client_id');
      
      const clientsWithBranchSet = new Set(clientsWithBranches?.map(cb => cb.client_id) || []);
      const unassignedHandlerCount = (allClients || []).filter(c => !clientsWithBranchSet.has(c.id)).length;
      
      // Check unassigned classes
      const { data: unassignedClasses, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .is('branch_id', null);
      
      if (classesError) throw classesError;
      
      // Check unassigned trainers
      const { data: unassignedTrainers, error: trainersError } = await supabase
        .from('trainers')
        .select('id')
        .is('branch_id', null);
      
      if (trainersError) throw trainersError;
      
      setStats({
        unassignedHandlers: unassignedHandlerCount,
        unassignedClasses: unassignedClasses?.length || 0,
        unassignedTrainers: unassignedTrainers?.length || 0
      });
      
    } catch (error) {
      console.error("Error checking allocation:", error);
      toast({
        title: "Error checking allocation",
        description: "An error occurred while checking branch allocation.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const fixAllocation = async () => {
    if (!currentBranch) {
      toast({
        title: "No branch selected",
        description: "Please select a branch first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsFixing(true);
      
      // Fix unassigned handlers
      const { error: handlersError } = await supabase
        .from('clients')
        .update({ branch_id: currentBranch.id })
        .is('branch_id', null);
      
      if (handlersError) throw handlersError;
      
      // Fix unassigned classes
      const { error: classesError } = await supabase
        .from('classes')
        .update({ branch_id: currentBranch.id })
        .is('branch_id', null);
      
      if (classesError) throw classesError;
      
      // Fix unassigned trainers
      const { error: trainersError } = await supabase
        .from('trainers')
        .update({ branch_id: currentBranch.id })
        .is('branch_id', null);
      
      if (trainersError) throw trainersError;
      
      toast({
        title: "Allocation fixed",
        description: "All unassigned records have been assigned to the current branch.",
      });
      
      // Recheck allocation
      await checkAllocation();
      
    } catch (error) {
      console.error("Error fixing allocation:", error);
      toast({
        title: "Error fixing allocation",
        description: "An error occurred while fixing branch allocation.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch Allocation Check</CardTitle>
        <CardDescription>
          Check and fix records that are not assigned to any branch
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-2">
            <p>Unassigned handlers: <strong>{stats.unassignedHandlers}</strong></p>
            <p>Unassigned classes: <strong>{stats.unassignedClasses}</strong></p>
            <p>Unassigned trainers: <strong>{stats.unassignedTrainers}</strong></p>
          </div>
        ) : (
          <p>Click "Check Allocation" to scan for records without a branch assignment.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={checkAllocation}
          disabled={isChecking || isFixing}
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Allocation"
          )}
        </Button>
        {stats && (stats.unassignedHandlers > 0 || stats.unassignedClasses > 0 || stats.unassignedTrainers > 0) && (
          <Button
            onClick={fixAllocation}
            disabled={isChecking || isFixing}
            variant="destructive"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Fix Allocation"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
