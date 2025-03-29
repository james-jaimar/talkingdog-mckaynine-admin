
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
          id="add-handler-trigger"
          variant="default"
          className="bg-mckaynine-600 hover:bg-mckaynine-700 text-white flex items-center gap-2"
          size="lg"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Add Handler</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
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
