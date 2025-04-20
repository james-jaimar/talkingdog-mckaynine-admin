
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Edit } from "lucide-react";
import { useState, ReactNode } from "react";
import { EditHandlerForm } from "./EditHandlerForm";
import { useIsMobile } from "@/hooks/useIsMobile";

interface EditHandlerModalProps {
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
    branch_id?: string | null;
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
  };
  onSuccess?: () => void;
  children?: ReactNode; // Add children prop
}

export function EditHandlerModal({ handler, onSuccess, children }: EditHandlerModalProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {children ? (
          <span onClick={() => setOpen(true)}>{children}</span>
        ) : (
          <Button variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            Edit Handler
          </Button>
        )}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[90vh] overflow-auto">
            <DrawerHeader>
              <DrawerTitle>Edit Handler</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <EditHandlerForm 
                handler={handler} 
                onSuccess={() => {
                  setOpen(false);
                  if (onSuccess) onSuccess();
                }} 
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {children ? (
        <span onClick={() => setOpen(true)}>{children}</span>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Handler
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Handler</DialogTitle>
          </DialogHeader>
          <EditHandlerForm 
            handler={handler} 
            onSuccess={() => {
              setOpen(false);
              if (onSuccess) onSuccess();
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
