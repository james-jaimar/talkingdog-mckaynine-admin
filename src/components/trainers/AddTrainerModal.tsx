
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserCheck, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function AddTrainerModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Trainer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Trainer</DialogTitle>
            <DialogDescription>
              To add a new trainer, first create a user account and assign them the trainer role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              New trainers need to be created as users first. You'll be able to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create a new user account</li>
                <li>Assign them the trainer role</li>
                <li>Add their trainer-specific information</li>
              </ul>
            </p>

            <Button 
              className="w-full" 
              onClick={() => {
                setOpen(false);
                navigate('/user-admin');
              }}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Go to User Management
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
