
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddHandlerModal } from "./hooks/add-handler-modal"; 
import { ModalHeader } from "./modal/ModalHeader";
import { HandlerSelectionTab } from "./modal/HandlerSelectionTab";
import { Class } from "../types/class";

interface AddHandlerToClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classData: Class;
  onSuccess: () => void;
}

export function AddHandlerToClassModal({
  open,
  onOpenChange,
  classId,
  classData,
  onSuccess,
}: AddHandlerToClassModalProps) {
  const { 
    isProcessing,
    searchQuery,
    setSearchQuery,
    addHandlerToClass,
    handleOpenChange
  } = useAddHandlerModal({
    classId,
    classData,
    onSuccess,
    onOpenChange
  });

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <ModalHeader classData={classData} />
        
        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-1">
            <TabsTrigger value="existing">Select Existing Handler</TabsTrigger>
          </TabsList>
          
          <HandlerSelectionTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelect={addHandlerToClass}
            classId={classId}
            isProcessing={isProcessing}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
