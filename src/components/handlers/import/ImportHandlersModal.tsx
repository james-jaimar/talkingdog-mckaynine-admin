
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
    toast({
      title: "Import successful",
      description: `${count} handlers imported successfully.`,
    });
    
    // Invalidate queries to force a refresh
    queryClient.invalidateQueries({ queryKey: ['handlers'] });
    
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
          </DialogDescription>
        </DialogHeader>
        <CSVImporter onImportSuccess={handleImportSuccess} />
      </DialogContent>
    </Dialog>
  );
}
