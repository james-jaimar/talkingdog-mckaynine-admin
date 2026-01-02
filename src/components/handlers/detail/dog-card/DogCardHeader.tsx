
import { EditDogModal } from "../EditDogModal";
import { DogAvatar } from "./DogAvatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DogCardHeaderProps {
  dog: {
    id: string;
    name: string;
    breed: string;
    avatar_url?: string;
  };
  clientId: string;
  onDogUpdated?: () => void;
}

export function DogCardHeader({ dog, clientId, onDogUpdated }: DogCardHeaderProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dog.id);

      if (error) throw error;

      toast({
        title: "Dog deleted",
        description: `${dog.name} has been removed from the handler's profile.`,
      });

      onDogUpdated?.();
    } catch (error) {
      console.error("Error deleting dog:", error);
      toast({
        title: "Error",
        description: "Failed to delete the dog. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <DogAvatar avatarUrl={dog.avatar_url} name={dog.name} />
        <div>
          <h3 className="font-semibold">{dog.name}</h3>
          <p className="text-sm text-gray-500">{dog.breed}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <EditDogModal dog={dog} clientId={clientId} onSuccess={onDogUpdated} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {dog.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {dog.name} 
                and all associated records (bookings, enrollments, etc.) from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
