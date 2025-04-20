
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
    branch_id?: string;
    uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
    social_media_consent_status: 'yes' | 'no' | 'not_marked';
  };
  onSuccess?: () => void;
  children?: ReactNode;
}

export function EditHandlerModal({ handler, onSuccess, children }: EditHandlerModalProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(true);
  };

  const renderEditButton = () => (
    <Button 
      variant="outline" 
      onClick={handleOpen} 
      className="w-full sm:w-auto"
    >
      <Edit className="h-4 w-4 mr-2" />
      Edit Handler
    </Button>
  );

  const renderModalContent = (isDrawer: boolean) => {
    const ModalContainer = isDrawer ? DrawerContent : DialogContent;
    const ModalHeader = isDrawer ? DrawerHeader : DialogHeader;
    const ModalTitle = isDrawer ? DrawerTitle : DialogTitle;

    return (
      <ModalContainer className="max-h-[90vh] overflow-auto">
        <ModalHeader>
          <ModalTitle>Edit Handler</ModalTitle>
        </ModalHeader>
        <div className="px-4 pb-4">
          <EditHandlerForm 
            handler={handler} 
            onSuccess={() => {
              setOpen(false);
              if (onSuccess) onSuccess();
            }} 
          />
        </div>
      </ModalContainer>
    );
  };

  if (isMobile) {
    return (
      <>
        {children ? (
          <span onClick={handleOpen}>{children}</span>
        ) : (
          renderEditButton()
        )}
        <Drawer open={open} onOpenChange={setOpen}>
          {renderModalContent(true)}
        </Drawer>
      </>
    );
  }

  return (
    <>
      {children ? (
        <span onClick={handleOpen}>{children}</span>
      ) : (
        renderEditButton()
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        {renderModalContent(false)}
      </Dialog>
    </>
  );
}
