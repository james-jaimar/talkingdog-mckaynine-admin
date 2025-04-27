
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { EditDogForm } from "./EditDogForm";

interface EditDogModalProps {
  dog?: {
    id: string;
    name: string;
    breed: string;
    age?: number;
    weight?: number;
    date_of_birth?: string;
    notes?: string;
    behavior_notes?: string;
    medical_notes?: string;
    avatar_url?: string;
  };
  clientId: string;
  onSuccess?: () => void;
  isNew?: boolean;
  // Add these required props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditDogModal({ dog, clientId, onSuccess, isNew = false, open: controlledOpen, onOpenChange }: EditDogModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Use either controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  console.log("EditDogModal received dog:", dog);

  const title = isNew ? "Add Dog" : "Edit Dog";
  const buttonText = isNew ? "Add Dog" : "Edit";

  if (isMobile) {
    return (
      <>
        {controlledOpen === undefined && (
          <Button variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
            {buttonText}
          </Button>
        )}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[90vh] overflow-auto">
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <EditDogForm 
                dog={dog} 
                clientId={clientId}
                onSuccess={() => {
                  setOpen(false);
                  if (onSuccess) onSuccess();
                }} 
                isNew={isNew}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {controlledOpen === undefined && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          {buttonText}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <EditDogForm 
            dog={dog} 
            clientId={clientId}
            onSuccess={() => {
              setOpen(false);
              if (onSuccess) onSuccess();
            }} 
            isNew={isNew}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
