import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditTrainerModal } from "./EditTrainerModal";
import { useBranch } from "@/context/BranchContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { Trainer } from "./types/trainer";
import { MapPin, UserCheck, UserX, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function TrainersTable() {
  const { currentBranch } = useBranch();
  const { toast } = useToast();
  const [deletionError, setDeletionError] = useState<string | null>(null);

  const { data: trainers, isLoading, refetch } = useQuery({
    queryKey: ['trainers', currentBranch?.id],
    queryFn: async () => {
      let query = supabase
        .from('trainers')
        .select(`
          *,
          branches:branch_id (
            name
          ),
          profiles (
            username,
            role
          )
        `);
      
      // Filter by branch if one is selected
      if (currentBranch) {
        query = query.eq('branch_id', currentBranch.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data to handle potential join errors and null values
      return (data || []).map(trainer => {
        // Check if profiles is an object but actually contains error info
        const hasProfileError = typeof trainer.profiles === 'object' && 
                               !Array.isArray(trainer.profiles) && 
                               // Use hasOwnProperty to check if the error property exists
                               Object.prototype.hasOwnProperty.call(trainer.profiles, 'error');
        
        return {
          ...trainer,
          branches: trainer.branches || null,
          // Set profiles to null if it has an error
          profiles: hasProfileError ? null : trainer.profiles
        };
      }) as unknown as (Trainer & { 
        branches: { name: string } | null;
        profiles: { username: string; role: string } | null;
      })[];
    },
    enabled: !!currentBranch // Only run query when a branch is selected
  });
  
  // Add mutation for deleting trainers
  const { mutate: deleteTrainer } = useMutation({
    mutationFn: async (trainerId: string) => {
      try {
        const { error } = await supabase
          .from('trainers')
          .delete()
          .eq('id', trainerId);
        
        if (error) {
          // Check for foreign key violation error
          if (error.message.includes('violates foreign key constraint')) {
            setDeletionError("This trainer can't be deleted because they are referenced in class schedules. Please reassign all their classes first.");
            throw new Error("Foreign key constraint violation");
          }
          throw error;
        }
        
        setDeletionError(null);
        return trainerId;
      } catch (error) {
        console.error("Error deleting trainer:", error);
        throw error;
      }
    },
    onSuccess: (trainerId) => {
      toast({
        title: "Trainer deleted",
        description: "The trainer has been successfully removed."
      });
      refetch();
    },
    onError: (error) => {
      // Toast is shown, but we don't overwrite the detailed error message
      toast({
        title: "Failed to delete trainer",
        variant: "destructive"
      });
    }
  });
  
  const createUserAccount = async (trainer: Trainer) => {
    if (trainer.user_id) {
      toast({
        title: "User account already exists",
        description: `${trainer.first_name} ${trainer.last_name} already has a user account.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // First, check if a user with this email already exists
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', trainer.email);
      
      if (existingProfiles && existingProfiles.length > 0) {
        // User exists, link trainer to existing user
        const { error: updateError } = await supabase
          .from('trainers')
          .update({ user_id: existingProfiles[0].id })
          .eq('id', trainer.id);
        
        if (updateError) throw updateError;
        
        // Update their role to 'trainer' if not already
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'trainer' })
          .eq('id', existingProfiles[0].id);
        
        if (roleError) throw roleError;
        
        toast({
          title: "User account linked",
          description: `${trainer.first_name} ${trainer.last_name} has been linked to an existing user account.`,
        });
      } else {
        // User doesn't exist, generate a random password
        const tempPassword = Math.random().toString(36).slice(-8);
        
        // Create user with Supabase Auth - this requires admin privileges
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: trainer.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { 
            full_name: `${trainer.first_name} ${trainer.last_name}`,
            trainer_id: trainer.id 
          }
        });
        
        if (authError) {
          if (authError.message.includes("User already registered")) {
            toast({
              title: "Email already registered",
              description: `The email ${trainer.email} is already registered but not linked. Please check user administration.`,
              variant: "destructive",
            });
          } else {
            throw authError;
          }
          return;
        }
        
        if (authUser?.user) {
          // Link the trainer to the new user
          const { error: updateError } = await supabase
            .from('trainers')
            .update({ user_id: authUser.user.id })
            .eq('id', trainer.id);
          
          if (updateError) throw updateError;
          
          // Set role to 'trainer'
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: 'trainer' })
            .eq('id', authUser.user.id);
          
          if (roleError) throw roleError;
          
          toast({
            title: "User account created",
            description: `User account created for ${trainer.first_name} ${trainer.last_name} with temporary password: ${tempPassword}`,
          });
        }
      }
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error("Error creating user account:", error);
      toast({
        title: "Error creating user account",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const removeUserAccount = async (trainer: Trainer) => {
    if (!trainer.user_id) {
      toast({
        title: "No user account",
        description: `${trainer.first_name} ${trainer.last_name} doesn't have a user account.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Just unlink the user account from the trainer, don't delete the user
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: null })
        .eq('id', trainer.id);
      
      if (error) throw error;
      
      toast({
        title: "User account unlinked",
        description: `${trainer.first_name} ${trainer.last_name}'s user account has been unlinked. The user account still exists in the system.`,
      });
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error("Error unlinking user account:", error);
      toast({
        title: "Error unlinking user account",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteTrainer = (trainer: Trainer) => {
    if (window.confirm(`Are you sure you want to delete ${trainer.first_name} ${trainer.last_name}?`)) {
      deleteTrainer(trainer.id);
    }
  };
  
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
    <>
      {deletionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cannot delete trainer</AlertTitle>
          <AlertDescription>
            {deletionError}{" "}
            <Link to="/trainer-references" className="font-medium underline">
              Go to Trainer References
            </Link> page to resolve this issue.
          </AlertDescription>
        </Alert>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Specialties</TableHead>
            <TableHead>User Account</TableHead>
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
                {trainer.user_id ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-sm">
                        Has access
                      </span>
                    </div>
                    {trainer.profiles && (
                      <ExtendedBadge variant="info" className="text-xs">
                        {trainer.profiles.role}
                      </ExtendedBadge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeUserAccount(trainer)}
                      className="mt-1 h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      Unlink account
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => createUserAccount(trainer)}
                    className="h-7 text-xs"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Create account
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EditTrainerModal trainer={trainer} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTrainer(trainer)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
