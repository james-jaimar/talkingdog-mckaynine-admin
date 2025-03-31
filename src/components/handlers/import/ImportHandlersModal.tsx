
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { CSVImporter } from "./CSVImporter";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function ImportHandlersModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleImportSuccess = (count: number) => {
    toast("Import successful", `${count} handlers imported successfully.`);
    
    // Force invalidate to refresh data immediately after import
    queryClient.invalidateQueries({ queryKey: ['handlers'] });
    
    // Close the modal
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <Upload className="h-5 w-5" />
          <span>Import Handlers</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Import Handlers</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import handlers and their dogs.
            Expected columns: E-mail, Dog's Name, Breed, DOB, Assess, Tel, PUPPY, EO, BRONZE CGC, SILVER CGC, BEGINNER/Novice, WT, YOGA, COMMENTS, WhatsApp, Photo Permission
          </DialogDescription>
        </DialogHeader>
        <CSVImporter onImportSuccess={handleImportSuccess} />
      </DialogContent>
    </Dialog>
  );
}
