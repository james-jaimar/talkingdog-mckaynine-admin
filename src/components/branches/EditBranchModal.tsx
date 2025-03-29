
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditBranchForm } from "./EditBranchForm";

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  email: string | null;
  capacity: number | null;
  admin_id: string | null;
}

interface EditBranchModalProps {
  branch: Branch;
}

export function EditBranchModal({ branch }: EditBranchModalProps) {
  const [open, setOpen] = useState(false);
  
  const handleSuccess = () => {
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit branch</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>
            Update the branch's information. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <EditBranchForm branch={branch} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
