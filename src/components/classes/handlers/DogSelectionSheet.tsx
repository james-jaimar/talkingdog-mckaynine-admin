
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, PlusCircle } from "lucide-react";

interface DogSelectionSheetProps {
  handler: {
    id: string;
    first_name: string;
    last_name: string;
    dogs: any[];
  } | null;
  open: boolean;
  onClose: () => void;
  onSelect: (handlerId: string, dogId: string) => void;
  isProcessing: boolean;
  processingDogId: string | null;
}

export function DogSelectionSheet({
  handler,
  open,
  onClose,
  onSelect,
  isProcessing,
  processingDogId
}: DogSelectionSheetProps) {
  if (!handler) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle>
            Dogs for {handler.first_name} {handler.last_name}
          </SheetTitle>
          <SheetDescription>
            Select a dog to add to this class
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-2 max-h-[70vh] overflow-y-auto pr-2">
          {handler.dogs && handler.dogs.length > 0 ? (
            handler.dogs.map((dog: any) => (
              <div 
                key={dog.id} 
                className="flex justify-between items-center p-3 bg-white rounded-md border hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{dog.name}</div>
                  <div className="text-sm text-muted-foreground">{dog.breed}</div>
                </div>
                <Button
                  variant="mckaynine"
                  size="sm"
                  onClick={() => onSelect(handler.id, dog.id)}
                  disabled={isProcessing}
                >
                  {isProcessing && processingDogId === dog.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-1" />
                  )}
                  Add
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-3">
              No dogs available to add for this handler.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
