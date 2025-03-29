
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { AddHandlerForm } from "./AddHandlerForm";

export function AddHandlerModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-mckaynine-600 hover:bg-mckaynine-700 text-white font-medium"
          size="default"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Handler
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Handler</DialogTitle>
          <DialogDescription>
            Enter the details of the new handler and their dog.
          </DialogDescription>
        </DialogHeader>
        <AddHandlerForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
